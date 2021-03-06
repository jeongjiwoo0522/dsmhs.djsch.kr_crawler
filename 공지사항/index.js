const axios = require("axios");
const cheerio = require("cheerio");

const DSMHS_URL = `https://dsmhs.djsch.kr`;

function handleError(err) {
  console.error(err);
  process.exit(1);
}

async function getFistNoticePagePath() {
  const { data: pageHtml } = await axios.get(`${DSMHS_URL}/boardCnts/list.do?boardID=54793&m=0201&s=dsmhs`);
  const $pageContent = cheerio.load(pageHtml);
  const firstNoticePath = $pageContent("td.link").eq(1).children().attr().onclick.match(/[0-9]+/g)[1];
  return `/boardCnts/view.do?boardID=54793&boardSeq=${firstNoticePath}&lev=0&searchType=null&statusYN=W&page=1&pSize=10&s=dsmhs&m=0202&opType=N`;
}

async function getNoticeBody($boardTextContent) {
  try {
    let body = "";
    const $viewBoxContentList = cheerio.load($boardTextContent.html())(".viewBox p");
    const length = $viewBoxContentList.length;
    for(let i=0; i<length; i++) {
      body += $viewBoxContentList.eq(i).text() + "\n";
    }
    return body.trim();
  } catch(err) {
    handleError(err);
  }
}

async function getNoticeTitle($boardTextContent) {
  try {
    const title = $boardTextContent("h1").eq(1).text().replace("제목", "");
    return title.trim();
  } catch(err) {
    handleError(err);
  }
}

async function getNoticeContentMedia($boardTextContent) {
  try {
    const $mediaContentList = $boardTextContent("dd a");
    const mediaLength = $mediaContentList.length;
    const mediaParsingData = [];
    for(let i=0; i<mediaLength; i++) {
      if($mediaContentList.eq(i).text()) {
        const mediumContentName = $mediaContentList.eq(i).text();
        const mediumReference = `${DSMHS_URL}${$mediaContentList.eq(i).attr().href}`;
        mediaParsingData.push({
          attach_name: mediumContentName,
          file_name: mediumReference
        });
      }
    }
    return mediaParsingData;
  } catch(err) {
    handleError(err);
  }
}

async function getNoticeWriter($boardTextContent) {
  return $boardTextContent(".infoBox li").html().replace(/<.+>/g, "").trim();
}

async function parseDsmhsKr() {
  const { data: pageHtml } = await axios.get(`${DSMHS_URL}${await getFistNoticePagePath()}`);
  const $boardTextContent = cheerio.load(cheerio.load(pageHtml)(".board-text").html());
  const result = {};
  await Promise.all([
    (async () => { result.body = await getNoticeBody($boardTextContent); })(),
    (async () => { result.title = await getNoticeTitle($boardTextContent); })(),
    (async () => { result.media = await getNoticeContentMedia($boardTextContent); })(),
    (async () => { result.writer = await getNoticeWriter($boardTextContent); })()
  ]);
  return result;
}

parseDsmhsKr()
  .then(console.log);
