const nodemailer = require('nodemailer')

function passwordResetMail(email, link){
    const transporter = nodemailer.createTransport({
        service: 'mail.ru',
        port: 587,
        auth: {
            user: 'service.collections@mail.ru',
            pass: process.env.emailPassword,
        },
    })

    const mailOptions = {
        from: 'service.collections@mail.ru',
        to: email,
        subject: 'resetting password',
        text: `link to reset the password: \n${link}`,
    }

    transporter.sendMail(mailOptions)
}

module.exports = { passwordResetMail }

