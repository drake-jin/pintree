
import { DB_CONFIG } from './secret'
import jetpack from 'fs-jetpack'

const sqlite = require('sqlite3').verbose()
const db = new sqlite.Database('./database.db')

const userId = 'test'

const QUERY = {
    INIT_USER: `
        CREATE TABLE USER (
            USER_ID varchar(40) NOT NULL DEFAULT '',
            USER_NAME varchar(40) DEFAULT NULL,
            USER_TOKKEN varchar(255) DEFAULT NULL,
            USER_DT datetime DEFAULT NULL,
            PRIMARY KEY (USER_ID)
        )
    `,
    CREATE_USER: `
        INSERT INTO USER (USER_ID, USER_NAME, USER_TOKKEN, USER_DT)
        VALUES (?, ?, ?, datetime('now'))
    `,
    GET_USER: `
        SELECT USER_ID id, USER_NAME name, USER_TOKKEN tokken, USER_DT dt
        FROM USER
        WHERE USER_ID = ?
    `,

    INIT_PADS: `
        CREATE TABLE PAD (
          PAD_ID INTEGER NOT NULL DEFAULT 0,
          USER_ID varchar(40) DEFAULT NULL,
          PAD_NAME varchar(40) DEFAULT NULL,
          PAD_STATE varchar(150) DEFAULT NULL,
          PAD_DT datetime DEFAULT NULL,
          PRIMARY KEY (PAD_ID)
        )
    `,
    GET_PADS: `
        SELECT PAD_ID id, PAD_NAME name, PAD_STATE state, PAD_DT dt
        FROM PAD
        WHERE USER_ID = ?
        ORDER BY id DESC
    `,
    ADD_PAD: `
        INSERT INTO PAD (USER_ID, PAD_NAME, PAD_STATE, PAD_DT)
        VALUES (?, ?, ?, datetime('now'))
    `,
    UPDATE_PAD: `
        UPDATE PAD
        SET PAD_STATE = ?, PAD_NAME = ?
        WHERE PAD_ID = ?
    `,
    DELETE_PAD: `
        DELETE FROM PAD
        WHERE PAD_ID = ?
    `,

    INIT_REVISIONS: `
        CREATE TABLE REVISION (
          REVISION_ID INTEGER NOT NULL DEFAULT 0,
          PAD_ID INTEGER DEFAULT NULL,
          REVISION_CONTENT text,
          REVISION_DT datetime DEFAULT NULL,
          PRIMARY KEY (REVISION_ID)
        )
    `,
    GET_REVISIONS: `
        SELECT REVISION_ID id, PAD_ID, REVISION_CONTENT content, REVISION_DT dt
        FROM REVISION
        WHERE PAD_ID = ?
        ORDER BY id DESC
    `,
    ADD_REVISION: `
        INSERT INTO REVISION (PAD_ID, REVISION_CONTENT, REVISION_DT)
        VALUES (?, ?, datetime('now'))
    `,
    CLEAR_REVISIONS: `
        DELETE FROM REVISION
        WHERE PAD_ID = ?
    `,
}


/**
 * 데이터베이스 초기화
 */
function init(){

    const initUser = function() {
        return new Promise((resolve, reject) => {
            db.run(QUERY.INIT_USER, (err, result) => {
                if(err) reject(err)
                else resolve(result)
            })
        })
    }

    const initPads = function() {
        return new Promise((resolve, reject) => {
            db.run(QUERY.INIT_PADS, (err, result) => {
                if(err) reject(err)
                else resolve(result)
            })
        })
    }

    const initRevisions = function() {
        return new Promise((resolve, reject) => {
            db.run(QUERY.INIT_REVISIONS, (err, result) => {
                if(err) reject(err)
                else resolve(result)
            })
        })
    }

    return initUser()
    .then((result) => initPads())
    .then((result) => initRevisions())
    .then((result) => createUser('test', '테스트', ''))
    .then((result) => createPad(
        'test',
        'noname',
        {
            width: 400,
            height: 321,
            frame: false,
            backgroundColor: '#fff',
            x: 1471,
            y: 247
        }
    ))
    .then((result) => savePad(
        1,
        {
            ops:[{
                insert: "hello world"
            }]
        }
    ))
}

/**
 * 유저를 생성한다
 * @param  {String} userId
 * @return {Promise} user
 */
const createUser = function(userId, userName, token) {
    return new Promise((resolve, reject) => {
        console.log('create user');
        db.run(QUERY.CREATE_USER, [userId, userName, token], (err, result) => {
            if(err) reject(err)
            else resolve(result)
        })
    })
}

/**
 * 유저의 모든 정보를 읽어온다
 * @param  {String} userId
 * @return {Promise} user
 */
function getUser( userId ){
    const user = {
        info: {
            id: userId
        },
        pads: []
    }

    const getPads = function( userId ){
        return new Promise((resolve, reject) => {
            db.all(QUERY.GET_PADS, [userId], (err, pads) => {
                //console.log(pads)
                if(err) reject(err)
                else resolve(pads)
            })
        })
    }

    const getRevisions = function( pads ){
        user.pads = pads.map( pad => {
            pad.state = JSON.parse(pad.state)
            return pad
        })
        const reqs = pads.map( pad => new Promise((resolve, reject) => {
            db.all(QUERY.GET_REVISIONS, [pad.id], (err, revs) => {
                // console.log(revs);
                if(err) reject(err)
                else resolve(revs)
            })
        }))
        return Promise.all(reqs)
    }

    return getPads( userId )
    .then( pads => getRevisions(pads) )
    .then( revs => {
        for(let i in revs){
            revs[i] = revs[i].map( rev => {
                // fix json format
                rev.content = JSON.parse(rev.content.replace(/\\n/g, '\\n'))
                return rev
            })
            user.pads[i].revisions = revs[i]
        }
        return user
    })
}


/**
 * 패드를 생성한다
 * @param  {String} user
 * @param  {String} padName
 * @param  {String} state
 * @return {Promise}
 */
function createPad( user, padName, state ){
    let connection = {}

    return new Promise((resolve, reject) => {
        console.log('create pad');
        db.run(QUERY.ADD_PAD, [user, padName, JSON.stringify(state)], (err, result) => {
            if(err) reject(err)
            else {
                db.get(QUERY.GET_PADS, [userId], (err, rev) => {
                    resolve({
                        insertId: rev.id
                    })
                })
            }
        })
    })
}


/**
 * 새로운 리비전을 추가한다
 * @param  {String} padId
 * @param  {String} content
 * @return {Promise}
 */
function savePad( padId, content ){
    let connection = {}

    return new Promise((resolve, reject) => {
        db.run(QUERY.ADD_REVISION, [padId, JSON.stringify(content)], (err, result) => {
            if(err) reject(err)
            else resolve(result)
        })
    })
}


/**
 * 윈도우 정보를 저장한다
 * @param  {String} padId
 * @param  {String} state
 * @return {Promise}
 */
function saveWindow( {id: padId, name, state} ){
    let connection = {}

    return new Promise((resolve, reject) => {
        console.log('create rev');
        db.run(QUERY.UPDATE_PAD, [JSON.stringify(state), name, padId], (err, result) => {
            if(err) reject(err)
            else resolve(result)
        })
    })
}


/**
 * 패드를 삭제한다
 * @param  {String} padId
 * @return {Promise}
 */
function removePad( padId, state ){
    let connection = {}

    const clearRevisions = function( padId ){
        return new Promise((resolve, reject) => {
            db.run(QUERY.CLEAR_REVISIONS, [padId], (err, result) => {
                if(err) reject(err)
                else resolve(result)
            })
        })
    }

    return clearRevisions(padId)
    .then(()=>{
        db.run(QUERY.DELETE_PAD, [padId], (err, result) => {
            if(err) Promise.reject(err)
            else Promise.resolve(result)
        })
    })
}


export default {
    init,
    getUser,
    savePad,
    saveWindow,
    removePad,
    createPad
}
