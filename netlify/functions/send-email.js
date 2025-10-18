const nodemailer = require('nodemailer')

exports.handler = async (event) => {
    const { names, mobile, date, time, fileBase64 } = JSON.parse(event.body)

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })

    // Split and match names + mobile numbers
    const nameList = names.split(',').map(n => n.trim())
    const mobileList = mobile.split(',').map(m => m.trim())

    const pairedList = nameList.map((name, idx) => {
        const number = mobileList[idx] || 'N/A'
        return `${name} - ${number}`
    })

    const bodyText = `Please be advised that the following individual/s are scheduled for shadowing on ${date} at ${time}\n\n${pairedList.join('\n')}`

    const mailOptions = {
        from: `"D'Vinci MSC"`,
        to: ['denise.flores@spxexpress.com','earnest.pineda@spxexpress.com', 'james.furio@spxexpress.com'],
        cc: ['ronald.masayda@spxexpress.com',
            'johncarlo.saldana@spxexpress.com',
            'ivan.arcega@spxexpress.com',
            'jopel.tomimbo@spxexpress.com',
            'jayson.familaran@spxexpress.com',
            'jessica.gamboa@spxexpress.com',
            'johncarlo.saldana@spxexpress.com',
            'jayson.montemayor@spxexpress.com',
            'ronn.siena@spxexpress.com',
            'joyce.basibas@spxexpress.com',
            'mickeypgonzaga@gmail.com',
            'fleetops@dvincimsc.com'],
        subject: `D'Vinci Drivers Endorsement Letter ${date}`,
        text: bodyText,
        attachments: [
            {
                filename: `${nameList[0]}_Letter.docx`,
                content: fileBase64,
                encoding: 'base64'
            }
        ]
    }

    try {
        await transporter.sendMail(mailOptions)
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully' })
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        }
    }
}
