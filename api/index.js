const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');


const app = express();

app.use(cors());
app.use(express.json());

const port = 2175;

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'cms'
})

connection.connect()

app.get('/', (req, res) => {
    res.send('This is CMS api');
})

app.get('/get_table', (req, res) => {
    const sql = "SELECT TABLE_NAME as table_name, TABLE_ROWS AS 'rows', CREATE_TIME AS create_time " +
                "FROM information_schema.tables WHERE table_schema = 'cms'";

    connection.query(sql, (err, result, field) => {
        if (err) console.log(err);

        res.send(result);
    })
})

app.post('/create_table', (req, res) => {
    const table = req.body;

    const tableName = table.tableName;
    const columns = table.tableColumns;
    const primaryKey = table.primaryKey;

    let columnSqlArr = [];
    let uniqueColumn = [];
    let foreignKeyColumn = [];

    columns.forEach(column => {
        let columnSql = `${column['columnName']} ${column['columnType']}`;

        const constraint = column['constraint'];

        if (constraint['notNull']) {
            columnSql += ' NOT NULL';
        }

        if (constraint['unique']) {
            uniqueColumn.push(column['columnName']);
        }

        if (constraint['foreignKey']) {
            foreignKeyColumn.push({
                columnName: column['columnName'],
                refTable: constraint['reference']['tableName'],
                refColumn: constraint['reference']['tableColumn']
            });
        }

        if (constraint['default'] != '') {
            columnSql += ` DEFAULT ${constraint['default']}`
        }

        columnSqlArr.push(columnSql);
    });

    let columnsParameter = columnSqlArr.join(', ');

    if (primaryKey != '') {
        columnsParameter += `, PRIMARY KEY (${primaryKey})`;
    }

    if (uniqueColumn.length > 0) {
        const uniqueParameter = uniqueColumn.join(', ');
        columnsParameter += `, UNIQUE (${uniqueParameter})`;
    }

    if (foreignKeyColumn.length > 0) {
        foreignKeyColumn.forEach(fkc => {
            const columnName = fkc['columnName'];
            const refTable = fkc['refTable'];
            const refColumn = fkc['refColumn'];

            columnsParameter += `, FOREIGN KEY (${columnName}) REFERENCES ${refTable}(${refColumn})`;
        })
    }

    let sql = `CREATE TABLE ${tableName} (${columnsParameter})`;

    console.log('SQL QUERY: ' + sql);

    connection.query(sql, (err, result, field) => {
        if (err) {
            res.send(err);

            return;
        }

        console.log('created table');
    })
})

app.listen(port, () => {
    console.log('Server is running on port ' + port + '...');
})