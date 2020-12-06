const mysql = require('mysql')
const Term = require('../models/term')

async function runQuery(connection, query) {
    return new Promise((resolve, reject) => {
        connection.query(query, function (error, results, fields) {
            if (error) reject(error);
            resolve(results)
        })
    })
}

async function runModule1() {
    const con = mysql.createConnection({
        host: process.env.THS_CON_MYSQL_HOST,
        user: process.env.THS_CON_MYSQL_USER,
        password: process.env.THS_CON_MYSQL_PASSWORD,
        database: process.env.THS_CON_MYSQL_DATABASE
    })

    con.connect()

    const [ { total } ] = await runQuery(con, 'SELECT COUNT(*) AS total FROM assigned_role')
    const limit = 50
    const pages = Math.floor(total / limit)
    for (let page = 0; page <= pages; page ++) {
        // if (page > 0)
        //     break

        console.log('Syncing thesaurus...', page, 'of', pages, 'pages')

        const items =
            await runQuery(con, `SELECT * FROM assigned_role LIMIT ${limit} OFFSET ${page * limit}`)
        
        for (let x of items) {
            const list = x.SpecificCategory ? x.SpecificCategory.split(':') : []
            let termCategoryId, termSpecificCategoryId  = null
            let termCategory, termSpecificCategory = null

            if (list.length > 0 && list[0] != 'Uncategorized') {
                const category = { title: list[0] }
                const { _id: categoryId } = await Category.findOneAndUpdate({ title: list[0] },
                    category, { new: true, upsert: true, setDefaultsOnInsert: true })
                    
                termCategoryId = categoryId
                termCategory = list[0]

                if (list.length > 1 && list[1] != 'Uncategorized') {
                    const specificCategory = { title: list[1], categoryId: termCategoryId, category: termCategory}
                    const { _id: specificCategoryId } = await SpecificCategory.findOneAndUpdate({ title: list[1] },
                        specificCategory, { new: true, upsert: true, setDefaultsOnInsert: true })
                        
                        termSpecificCategoryId = specificCategoryId
                        termSpecificCategory = list[1]
                }
            }

            const term = {
                title: x.PreferredTerm,
                categoryId: termCategoryId,
                category: termCategory,
                specificCategoryId: termSpecificCategoryId,
                specificCategory: termSpecificCategory
            }
 
            await Term.findOneAndUpdate({ title: x.PreferredTerm },
                term, { upsert: true, setDefaultsOnInsert: true })
        }
    }

    con.end()  
}

async function runModule2() {
    const con = mysql.createConnection({
        host: process.env.THS_CON_MYSQL_HOST,
        user: process.env.THS_CON_MYSQL_USER,
        password: process.env.THS_CON_MYSQL_PASSWORD,
        database: process.env.THS_CON_MYSQL_DATABASE
    })

    con.connect()

    const [ { total } ] = await runQuery(con, 'SELECT COUNT(*) AS total FROM assigned_role')
    const limit = 50
    const pages = Math.floor(total / limit)
    for (let page = 0; page <= pages; page ++) {
        console.log('Syncing thesaurus...', page, 'of', pages, 'pages')

        const items =
            await runQuery(con, `SELECT * FROM assigned_role LIMIT ${limit} OFFSET ${page * limit}`)
        
        for (let x of items) {
            const list = x.SpecificCategory ? x.SpecificCategory.split(':') : []
            let termCategory, termSpecificCategory = null

            if (list.length > 0) {
                if (list[0] != 'Uncategorized' && list[0] != 'Uncategoried')
                    termCategory = list[0]
                else
                    termCategory = 'Others'

                const categoryTerm = {
                    title: null,
                    category: termCategory,
                    specificCategory: null
                }

                await Term.findOneAndUpdate(categoryTerm,
                    categoryTerm, { upsert: true, setDefaultsOnInsert: true })

                if (list.length > 1 && list[1] != 'Uncategorized') {
                    termSpecificCategory = list[1]
                }
            }

            const term = {
                title: x.PreferredTerm,
                category: termCategory,
                specificCategory: termSpecificCategory
            }
 
            await Term.findOneAndUpdate({ title: x.PreferredTerm },
                term, { upsert: true, setDefaultsOnInsert: true })
        }
    }

    con.end()
}

runModule2()