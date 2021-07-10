const axios = require("axios");
const cheerio = require("cheerio");

const DSMHS_URL = `https://dsmhs.djsch.kr`;

let noticeBody = "";

function handleError(err) {
  console.error(err);
  process.exit(1);
}

function getNoticeTitle(domContent) {
  try {
    return domContent.childNodes[4].childNodes[1].data;
  } catch(err) {
    handleError(err);
  }
}

function subStringNoticeBody(arr) {
  if(!arr) { return; }
  for(let a of arr) { a.data ? noticeBody = `${noticeBody}\n${a.data}` : subStringNoticeBody(a.children); }
}

function getNoticeContentMedia(domContent) {
  try {
    const media = [];
    for(let i=1;; i+= 4) {
      const medium = domContent.childNodes[8] ? domContent.childNodes[8].childNodes[1].childNodes[3].childNodes[i] : false;
      if(!medium) break;
      media.push(`${DSMHS_URL}${medium.attribs.href}`)
    }
    return media;
  } catch(err) {
    handleError(err);
  }
}

async function parseDsmhsKr() {
  try {
    const { data: pageHtml } = await axios.get(`${DSMHS_URL}/boardCnts/list.do?type=default&page=1&m=0201&s=dsmhs&boardID=54793`);
    let $ = cheerio.load(pageHtml);
    const boardSeq = $(".link")[3].childNodes[1].attribs.onclick.toString().match(/[0-9]+/g)[1];
    const { data: noticeHtml } = await axios.get(`${DSMHS_URL}/boardCnts/view.do?boardID=54793&boardSeq=${boardSeq}&lev=0&searchType=null&statusYN=W&page=3&pSize=11&s=dsmhs&m=0201&opType=N`);
    $ = cheerio.load(noticeHtml);
    const boardText = $(".board-text")[0];
    const title = getNoticeTitle(boardText);
    subStringNoticeBody(boardText.childNodes[6].children);
    const body = noticeBody;
    noticeBody = "";
    const attach = getNoticeContentMedia(boardText);
    return { body, title, attach };
  } catch(err) {
    handleError(err);
  }
}

parseDsmhsKr()
  .then(console.log);
