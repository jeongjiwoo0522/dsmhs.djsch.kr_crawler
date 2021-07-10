const axios = require("axios");
const cheerio = require("cheerio");

const DSMHS_URL = `https://dsmhs.djsch.kr`;
const GalleryURL = (boardSeq) => `https://dsmhs.djsch.kr/boardCnts/view.do?boardID=54803&boardSeq=${boardSeq}&lev=0&searchType=null&statusYN=N&page=1&pSize=undefined&s=dsmhs&m=0208&opType=N`;

async function parseGallery(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  
  // date 
  const date = $(".infoBox li").eq(1).html().replace(/<.+>/g, "");
  
  // pictures 
  const pictures = [];
  const pic_box = $(".pic_box img");
  const picLength = pic_box.length;
  for(let i=0; i<picLength; i++) {
    pictures.push(`${DSMHS_URL}${pic_box.eq(i).attr().src}`);
  }
  
  // title 
  const tit = $(".tit").eq(1).html().replace(/<.+>/g, "")
  
  // body 
  const body = [];
  const bodyChuckes = $(".viewBox p");
  const bodyChuckLength = bodyChuckes.length;
  for(let i=0; i<bodyChuckLength; i++) {
    body.push(bodyChuckes.eq(i).text());
  }

  return { date, title: tit.replace(/'/g, ""), body: body.join("\n").replace(/'/g, ""), pictures };
}

async function parseDsmhsKr() {
  const { data } = await axios.get(`${DSMHS_URL}/boardCnts/list.do?boardID=54803&m=0208&lev=0&s=dsmhs`);
  const $ = cheerio.load(data);
  const galleries = $(".board-imgTxt ul li div a");
  const boardSeq = galleries.eq(0).eq(0).attr().onclick.toString().match(/[0-9]+/g)[1];
  return parseGallery(GalleryURL(boardSeq));
}

parseDsmhsKr()
  .then(console.log);
