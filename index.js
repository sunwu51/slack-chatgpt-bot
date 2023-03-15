var express = require('express')
var axios = require('axios')
var app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

var chatUrl = `https://api.openai.com/v1/chat/completions`
var slackUrl = `https://slack.com/api/chat.postMessage`
var token = process.env.TOKEN
var apiKey = process.env.API_KEY

/**?channel=chat&text=%3C%40U043Q996345%3E%20hello%E8%BF%99%E4%B8%AA%E4%B8%9C%E8%A5%BF%E6%98%AF%E8%BF%99%E6%A0%B7%E6%BB%B4%60%60%60%5Cnprint(123)%5Cn%60%60%60over&pretty=1
 * body: {
    token: 'Q3YyQAaeNNFjjJ7mAurIIAkj',
    team_id: 'T0445SPU4BB',
    api_app_id: 'A04U2KVCQDS',
    event: {
      client_msg_id: 'a923e02d-b747-4531-83c5-22082de5fd6f',
      type: 'app_mention',
      text: '<@U04TTJPNH2A> 嘎嘎嘎',
      user: 'U043Q996345',
      ts: '1678869727.512129',
      blocks: [Array],
      team: 'T0445SPU4BB',
      channel: 'C04U07849TL',
      event_ts: '1678869727.512129'
    },
    type: 'event_callback',
    event_id: 'Ev04TXV6H7GV',
    event_time: 1678869727,
    authorizations: [ [Object] ],
    is_ext_shared_channel: false,
    event_context: '4-eyJldCI6ImFwcF9tZW50aW9uIiwidGlkIjoiVDA0NDVTUFU0QkIiLCJhaWQiOiJBMDRVMktWQ1FEUyIsImNpZCI6IkMwNFUwNzg0OVRMIn0'
  },
 */
app.use('/slack', async (req, res) => {
    var start = new Date().getTime()
    if (req.body.challenge) {
        res.json({challenge : req.body.challenge})
        return
    }
    let { event } = req.body;
    let content = event.text.substring(event.text.indexOf(' ') + 1)
    console.log({content})
    if (event.text && event.text.length > 0) {
        let {data} = await axios({
            url: chatUrl,
            method:"POST",
            headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
            data: {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "user", "content": content}
                ]
            }
        })
        var end = new Date().getTime()
        console.log(`gpt time: ${end - start}ms`)
        start = end;
        let gptRes = data.choices[0].message.content;

        console.log(`
            from ${event.user}: ${content}
            gpt: ${gptRes}
            usage: ${data.usage.total_tokens} tokens
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