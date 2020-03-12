let origin = window.top !== window && localStorage.getItem('__from_3rd_party');
const match = /[?&]__from_3rd_party=([^&#?]*)/ig.exec(location.search);
const isFrom3rdParty = !!match || !!origin;
origin = (match && match[1]) || origin;
localStorage.setItem('__from_3rd_party', origin || '');

window[Symbol.for('isFrom3rdParty')] = isFrom3rdParty;

export default isFrom3rdParty;
