const axios = require("axios");
const cheerio = require("cheerio");

const DSMHS_URL = `https://dsmhs.djsch.kr`;

async function getMealImagePath(boardSeq, pageNumber) {
  try {
    const { data } = await axios.get(`${DSMHS_URL}/boardCnts/view.do?boardID=54798&boardSeq=${boardSeq}&lev=0&searchType=null&statusYN=W&page=${pageNumber}&pSize=10&s=dsmhs&m=020504&opType=N`);
    const $ = cheerio.load(data);
    return $("img")[5].attribs.src;
  } catch(err) {
    console.log(err);
    process.exit(1);
  }
}

async function parseDsmhsKr() {
  try {
    const { data } = await axios.get(`${DSMHS_URL}/boardCnts/list.do?type=default&page=1&m=020504&s=dsmhs&boardID=54798`);
    const $ = cheerio.load(data); 
    const boardTitles = $(".link").text().split("\n");  
    const startIndex = boardTitles.length - 10;   // 마지막 10개만 유의미한 값
    const mealPictures = {};
    await Promise.all(
      (new Array(3))
      .fill()
      .map(async (_, i) => {
        const boardSeq = $(".link")[i].childNodes[1].attribs.onclick.toString().match(/[0-9]+/g)[1];  // image parsing
        const imgPath = await getMealImagePath(boardSeq, 1);                                          // image parsing
        mealPictures[boardTitles[startIndex + i]] = `${DSMHS_URL}${imgPath}`;
      })
    );
    return mealPictures;
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}

parseDsmhsKr()
  .then(console.log);
