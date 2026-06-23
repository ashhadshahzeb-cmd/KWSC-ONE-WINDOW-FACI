const url = 'https://docs.google.com/spreadsheets/d/1sSKmkgro7359hgBNxfv-IuOQALjuGARCy-GwUaUBKu8/edit';
fetch(url)
  .then(r => r.text())
  .then(html => {
    const regex = /\["([^"]+)",(\d+),/g;
    let match;
    const tabs = [];
    while ((match = regex.exec(html)) !== null) {
      tabs.push({name: match[1], gid: match[2]});
    }
    console.log(JSON.stringify(tabs, null, 2));
  });
