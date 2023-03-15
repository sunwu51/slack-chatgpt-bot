var express = require('express')
var axios = require('axios')
var app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// var chatUrl = `https://api.openai.com/v1/chat/completions`
var chatUrl = `https://api.forchange.cn/`
var slackUrl = `https://slack.com/api/chat.postMessage`
var token = process.env.TOKEN
var apiKey = process.env.API_KEY
var s = new Set()
var ctx = []

setInterval(()=>s.clear(), 1000 * 60 * 100)

app.use('/slack', async (req, res) => {
    var start = new Date().getTime()
    if (req.body.challenge) {
        res.json({challenge : req.body.challenge})
        return
    }

    // console.log(req.body)
    let { event } = req.body;
    let id = event.client_msg_id
    if (s.has(id)) {
        res.json({challenge : "" });
        return;
    } else {
        s.add(id)
    }
    let content = event.text.substring(event.text.indexOf(' ') + 1)
    console.log({content})
    if (event.text && event.text.length > 0) {
        var messages = [
            {role:"system","content":"请以markdown的形式返回答案"},
            ...ctx,
            {role:'user', content}
           ]
        console.log({messages})
        let {data} = await axios({
            url: chatUrl,
            method:"POST",
            headers:{"Content-Type":"application/json"},
            data: {
               messages,
               "tokensLength":3282,
               "model":"gpt-3.5-turbo"
            }
        })
        console.log(`gpt time: ${end - start}ms`)
        let gptRes = data.choices[0].message.content;

        ctx.push({role:'user', content});
        ctx.push({role:'assistant', content: gptRes});
    
        if (ctx.length > 20) {
            ctx.shift();
            ctx.shift();
        }
        
        var end = new Date().getTime()
        start = end;
        // let gptRes = data.message;
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
        

        res.json(data);
    } 


})
app.listen(5000, ()=>{
    console.log("Listening on port 5000")
});
module.exports = app;
