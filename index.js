const axios = require("axios");
const config = require("./config.json");
const ytApiKey = process.env.API_TOKEN || config.ytApiKey;
const discordWebhookToken = process.env.WEBHOOK_TOKEN || config.discordWebhookToken;
const videos = {new: [], old: []};

function listen(timeout = 5){
    (async function loop(){
        try {
            videos.new = await loadVideos();
            if (!videos.old.length) {
                videos.old = videos.new;
            }
            if (videos.old !== videos.new) {
                let diff = videos.new.filter(id => !videos.old.includes(id));
                for (let i = diff.length - 1; i >= 0; i--) {
                    let videoId = diff[i];
                    await sendToDiscord(videoId);
                    videos.old.push(videoId);
                }
            }
        }catch(e){
            console.error("Error", e);
        }
        setTimeout(loop, 1000 * 60 * timeout);
    })();
}
function loadVideos(){
    return new Promise((resolve, reject) => {
        axios.get(`https://www.googleapis.com/youtube/v3/search?key=${ytApiKey}&channelId=${config.channelId}&part=snippet,id&order=date&maxResults=5`).then(data => {
            data = data.data;
            if(!data.items) return;

            let videos = [];
            data.items.forEach(item => {
                videos.push(item.id.videoId);
            });
            resolve(videos);
        }).catch(e => reject(e));
    });
}
function sendToDiscord(videoId) {
    return axios.post(`https://discordapp.com/api/webhooks/${config.discordChannel}/${discordWebhookToken}`, {
        "username": "YouTube",
        "avatar_url": "https://share.bergflix.de/icons/webhook.png",
        "embeds": [{
            "title": "YouTube Check",
            "description": `Es gibt ein neues Video von HerrBergmann auf [YouTube](https://youtu.be/${videoId}).\n`
                +`Starte hier den [Upload](https://bergflix.de/upload/${videoId}) auf Bergflix`,
            "color": 15746887
        }]
    });
}

listen(3);
console.log("Now listening on youtube uploads");
