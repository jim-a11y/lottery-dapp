// 引入 Express
const express = require('express');
const app = express();

// 設定根路徑的回應
app.get('/', (req, res) => {
  res.send('吃我雞雞');
});

// 啟動伺服器，監聽埠 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});