const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const ejs = require('ejs');

const app = express();

// 创建数据库连接
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'Qbw200452.,',
    database: 'flywings'
});

// 连接数据库
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

// 设置 EJS 模板引擎
app.set('view engine', 'ejs');

// 设置静态文件目录
app.use(express.static('public'));

// 使用 body-parser 中间件解析请求体
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 路由处理
app.get('/', (req, res) => {
    // 查询 bk_category 表格中的数据
    db.query('SELECT * FROM bk_category', (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        // 渲染主页，传递查询到的数据给模板
        res.render('HomePage', { categories: results });
    });
});

// 添加类别的路由处理
app.post('/addCategory', (req, res) => {
    // 从请求体中获取新增类别的名字
    const categoryName = req.body.categoryName;
    
    // 插入新类别到数据库
    db.query('INSERT INTO bk_category (Name) VALUES (?)', [categoryName], (err, results) => {
        if (err) {
            console.error('Error inserting category into database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        
        // 返回新增类别的信息
        res.json({ success: true, message: 'Category added successfully' });
    });
});


// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
