const core = require("@actions/core");
const fetch = require('node-fetch');
const daysjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const fs = require("fs");
daysjs.extend(utc);
daysjs.extend(timezone);

async function weather () {
    const weatherKey = core.getInput("weatherKey");
    const location = core.getInput("location");
    const type = core.getInput("type");
    const txKey = core.getInput('txKey');
    const startDay = core.getInput('startDay');

    if (!weatherKey || !location) {
        core.warning("Configure the weather key and city address. reference address: https://dev.qweather.com/docs/configuration/project-and-key/")
    }

    // 未来3天生活指数
    const url = `https://devapi.qweather.com/v7/weather/3d?key=${weatherKey}&location=${location}`
    const weatherRes = await fetch(url);
    const data = await weatherRes.json();
    // 获取当前生活指数
    const lifeUrl = `https://devapi.qweather.com/v7/indices/1d?key=${weatherKey}&location=${location}&type=${type}`;
    const lifeRes = await fetch(lifeUrl);
    const lifeData = await lifeRes.json();
    const oneUrl = `http://api.tianapi.com/txapi/one/index?key=${txKey}`
    const oneRes = await fetch(oneUrl);
    const oneData = await oneRes.json();
    const { word, imgurl } = oneData?.newslist[0];
    // 计算日期
    const lovingDays = startDay && daysjs(daysjs().tz('Asia/Shanghai')).diff(
        startDay,
        'days'
    ) || false;
    const htmlStr = strHtml(data, lifeData, word, imgurl, lovingDays);
    // fs.writeFileSync('weather.html', htmlStr);
    return htmlStr;
}

/**
 * 生成html
 * @param {*} weatherData 
 * @param {*} lifeData 
 * @param {*} word 
 * @param {*} imgurl 
 * @param {*} lovingDays 
 * @returns 
 */
function strHtml (weatherData, lifeData, word, imgurl, lovingDays) {
    const { daily: weatherDataDaily } = weatherData;
    const { daily } = lifeData;
    const wList = weatherDataDaily.slice(1).map(w => {
        const { fxDate, tempMin, tempMax, textDay } = w;
        return (`<li style="margin-bottom: 10px">
        预报日期：
        ${fxDate}(${textDay}),最低温度：${tempMin}℃, 最高温度:${tempMax}℃;
        </li>`)
    }).join('')
    const indexs = daily.map(i => {
        const { name, text, category } = i;
        return (`<li style="margin-bottom: 10px">
        ${name}(${category}):
        ${text}
      </li>`)
    }).join('');
    let lovingStr = '';
    if (lovingDays) {
        lovingStr = `<div>
        <p>今天是在一起的第${lovingDays}天！</p>
     </div>`
    }
    return `<!DOCTYPE html><html>
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body>
      <div>
            ${lovingStr}
        <!-- 图片 -->
        <div>
          <img
            style="width: 100%; max-width: 768px"
            src="${imgurl}"
            alt="图片"
          />
        </div>
        <!-- 每日一句 -->
        <div>
          <p style="font-size: 14px; text-indent: 2em; font-style: italic;">
            ${word}
          </p>
        </div>
        <!-- 天气 -->
        <div>
          <p>
            <b>今日天气:</b>
            <span>${weatherDataDaily[0].fxDate}(${weatherDataDaily[0].textDay}) ${weatherDataDaily[0].tempMin}°C - ${weatherDataDaily[0].tempMax}°C</span>
          </p>
          <ul>
            ${wList}
          </ul>
        </div>
        <div>
            <p><b>天气指数:</b></p>
            <ul>
                ${indexs}
            </ul>
        </div>
      </div>
    </body>
    </html>`;
}

module.exports = weather;