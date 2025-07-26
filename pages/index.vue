<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
    <div class="bg-white shadow-xl rounded-2xl p-6 w-full max-w-xl space-y-5">
      <h1 class="text-2xl font-bold text-center text-gray-800">Generate Endorsement Letter</h1>

      <input v-model="names" placeholder="Names (comma-separated)" class="w-full px-4 py-2 border rounded-lg" />
      <input v-model="mobile" placeholder="Mobile numbers (comma-separated)" class="w-full px-4 py-2 border rounded-lg" />
      <input v-model="date" type="date" class="w-full px-4 py-2 border rounded-lg" />
      <input v-model="time" placeholder="Time" class="w-full px-4 py-2 border rounded-lg" />

      <select v-model="location" class="w-full px-4 py-2 border rounded-lg">
        <option value="SOC 4">SOC 4 - Bustos</option>
        <option value="SOC 5">SOC 5 - Univation</option>
        <option value="SOC 6">SOC 6 - Meycauayan</option>
      </select>

      <button @click="generateDocument" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Generate & Send</button>
      <p v-if="message" class="text-center text-green-600 font-medium mt-2">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { saveAs } from 'file-saver'

const names = ref('')
const mobile = ref('')
const date = ref('')
const time = ref('')
const location = ref('SOC 4')

const message = ref('')

const addresses = {
  'SOC 4': 'Bustos Parking (temp parking, but assigned for SOC 4 trips) - NCT Transntional Corp (CY-Bulacan)',
  'SOC 5': 'Univation Parking - Gate 2, Univation Motor Philippines, Inc. - Nissan Technopark, Pulong Santa Cruz, Santa Rosa, Laguna',
  'SOC 6': 'SOC 6 Parking - North Distribution Center 2, Meycauayan, Bulacan'
}

function formatDate(input) {
  return new Date(input).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function generateDocument() {
  const response = await fetch('/templates/Template.docx')
  const content = await response.arrayBuffer()
  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })

  const formattedNames = names.value.split(',').map(n => n.trim()).join(', ')
  const formattedMobiles = mobile.value.split(',').map(m => m.trim()).join(', ')
  const formattedDate = formatDate(date.value)

  try {
    // ✅ Only one call to render() with data
    doc.render({
      date: formattedDate,
      address: addresses[location.value],
      driver_name: formattedNames
    })

    const blob = doc.getZip().generate({ type: 'blob' })
    saveAs(blob, `${formattedNames.split(',')[0]}_Letter.docx`)

    const reader = new FileReader()
    reader.onload = async () => {
      const base64File = reader.result.split(',')[1]
      await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          names: formattedNames,
          mobile: formattedMobiles,
          date: formattedDate,
          time: time.value,
          fileBase64: base64File
        })
      })

      names.value = ''
      mobile.value = ''
      date.value = ''
      time.value = ''
      location.value = 'SOC 4'
      message.value = 'File generated and email sent successfully!'
    }
    reader.readAsDataURL(blob)
  } catch (error) {
    console.error('Document error:', error)
    message.value = 'Something went wrong. Please try again.'
  }
}

</script>

