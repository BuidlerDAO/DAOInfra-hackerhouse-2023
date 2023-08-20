function isEmptyObj(obj) {
  return obj === null || obj === '' || obj === 'undefined' || typeof obj === 'undefined';
}

function getSpanTime(createtime){
  var now = Date.parse(new Date()) / 1000;
  var limit = now - createtime;
  var content = "";
  if (limit < 60) {
    content="Just Now";
  } else if (limit >= 60 && limit < 3600){
    content = Math.floor(limit / 60) + " Minutes Ago";
  } else if (limit >= 3600 && limit < 86400){
    content = Math.floor(limit / 3600) + " Hours Ago";
  } else if (limit >= 86400 && limit < 2592000){
    content = Math.floor(limit / 86400) + " Days Ago";
  } else if (limit >= 2592000 && limit < 31104000){
    content = Math.floor(limit / 2592000) + " Months Ago";
  } else{
    content = "One Year Ago";
  }
  return content;
}


export { isEmptyObj, getSpanTime };
