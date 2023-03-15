var express = require('express')
var axios = require('axios')
var app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// var chatUrl = `https://api.openai.com/v1/chat/completions`
var chatUrl = `https://api.okchatgpt.net/api/litemsg`
var slackUrl = `https://slack.com/api/chat.postMessage`
var token = process.env.TOKEN
var apiKey = process.env.API_KEY


app.use('/slack', async (req, res) => {
    var start = new Date().getTime()
    if (req.body.challenge) {
        res.json({challenge : req.body.challenge})
        return
    }
    console.log(req.body)
    let { event } = req.body;
    let content = event.text.substring(event.text.indexOf(' ') + 1)
    console.log({content})
    if (event.text && event.text.length > 0) {
        let {data} = await axios({
            url: chatUrl,
            method:"POST",
            headers:{"Content-Type":"application/json"},
            data: {
               content
            }
        })
        var end = new Date().getTime()
        console.log(`gpt time: ${end - start}ms`)
        start = end;
        // let gptRes = data.choices[0].message.content;
        let gptRes = data.message;
        console.log(`
            from ${event.user}: ${content}
            gpt: ${gptRes}
        `);

        await axios({
            url: slackUrl,
            method:"POST",
            headers:{"Authorization":`Bearer ${token}`},
            data: {
                "channel": event.channel,
                "text": gptRes, 
            }
        })
        var end = new Date().getTime()
        console.log(`send slack time: ${end - start}ms`)
        

        res.json({challenge : "" });
    } 


})
app.listen(5000, ()=>{
    console.log("Listening on port 5000")
});
module.exports = app;