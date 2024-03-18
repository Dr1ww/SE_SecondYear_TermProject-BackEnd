const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const multer = require('multer');
const path = require('path');

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

    // 查询最后一条记录的ID
    db.query('SELECT ID FROM bk_category ORDER BY ID DESC LIMIT 1', (err, results) => {
        if (err) {
            console.error('Error querying last category ID from database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        // 计算新类别的ID
        let newCategoryId = 1; // 默认为1
        if (results.length > 0) {
            newCategoryId = results[0].ID + 1; // 上一条记录的ID加一
        }

        // 插入新类别到数据库
        db.query('INSERT INTO bk_category (ID, Name) VALUES (?, ?)', [newCategoryId, categoryName], (err, results) => {
            if (err) {
                console.error('Error inserting category into database:', err);
                res.status(500).send('Internal Server Error');
                return;
            }

            // 返回新增类别的信息
            res.json({ success: true, message: 'Category added successfully' });
        });
    });
});

// 删除类别的路由处理
app.post('/deleteCategory', (req, res) => {
    // 从请求体中获取要删除的类别的ID
    const categoryId = req.body.categoryId;

    // 删除对应ID的类别
    db.query('DELETE FROM bk_category WHERE ID = ?', [categoryId], (err, results) => {
        if (err) {
            console.error('Error deleting category from database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        
        // 返回删除成功的消息
        res.json({ success: true, message: 'Category deleted successfully' });
    });
});

// 处理 Product 页面的路由
app.get('/Product', (req, res) => {
    // 查询 bk_menproduct 表格中的产品信息
    db.query('SELECT * FROM bk_menproduct', (err, results) => {
        if (err) {
            console.error('Error querying products from database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        // 渲染 Product 页面，传递查询到的数据给模板
        res.render('Product', { products: results });
    });
});

// 处理单个产品的路由
app.get('/product/:id', (req, res) => {
    // 从请求参数中获取产品ID
    const productId = req.params.id;

    // 查询数据库中对应ID的产品信息
    db.query('SELECT * FROM bk_menproduct WHERE id = ?', [productId], (err, results) => {
        if (err) {
            console.error('Error querying product from database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        // 如果找到了产品，则将产品信息作为 JSON 数据发送回客户端
        if (results.length > 0) {
            const product = results[0];
            res.json(product);
        } else {
            // 如果未找到产品，则返回404错误
            res.status(404).send('Product Not Found');
        }
    });
});

// 处理编辑产品信息的路由
app.post('/updateProduct/:id', (req, res) => {
    const id = req.params.id; // 从请求参数中获取产品ID
    const { title, price, size_options } = req.body; // 获取编辑后的产品信息

    db.query('UPDATE bk_menproduct SET title = ?, price = ?, size_options = ? WHERE id = ?', [title, price, size_options, id], (err, results) => {
        if (err) {
            console.error('Error updating product in database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.json({ success: true, message: 'Product updated successfully' });
    });
});

// 处理删除产品的路由
app.delete('/deleteProduct/:id', (req, res) => {
    // 获取要删除的产品的ID
    const productId = req.params.id;

    // 从数据库中删除对应ID的产品信息
    db.query('DELETE FROM bk_menproduct WHERE id = ?', [productId], (err, results) => {
        if (err) {
            console.error('Error deleting product from database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        // 返回删除成功的消息
        res.json({ success: true, message: 'Product deleted successfully' });
    });
});

// 设置文件上传的存储位置和文件名
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public', 'image by amber')); // 存储到 public/images 目录下
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // 使用原始文件名作为文件名
    }
});

// 创建 Multer 实例
const upload = multer({ storage: storage });

// 处理添加产品的 POST 请求
app.post('/addProduct', upload.single('image'), (req, res) => {
    // 获取表单提交的数据
    const { id, category_id, title, price, size_options } = req.body;
    const image = req.file; // 上传的图片文件对象

    // 如果没有上传图片，则返回错误
    if (!image) {
        return res.status(400).send('No image uploaded');
    }

    // 将图片文件移动到指定目录
    const imageName = image.originalname;
    const imagePath = '../image by amber/' + imageName;

    // 将数据插入到 bk_menproduct 表中
    const sql = 'INSERT INTO bk_menproduct (id, cate_id, title, image_path, price, size_options) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [id, category_id, title, imagePath, price, size_options];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting product into database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        console.log('Product added successfully:', result);
        res.send('Product added successfully!');
    });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
