const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const { channels } = require('../src/shared/constants')
const path = require('path')
const url = require('url')

const connection = require('./connection')
const LocationDao = require('./LocationDao')
const SubjectDao = require('./SubjectDao')
const ScheduleDao = require('./ScheduleDao')
const LecturerDao = require('./LecturerDao')
const StudentDao = require('./StudentDao')
const SessionDao = require('./SessionDao')
const TagDao = require('./TagDao')

let win

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1024,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    })

    // and load the index.html of the app.
    win.loadURL(
        process.env.ELECTRON_START_URL || url.format({
            pathname: path.join(__dirname, '../index.html'),
            protocol: 'file:',
            slashes: true
        }))

    // Open the DevTools.
    win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', async () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })

    const menu = Menu.buildFromTemplate([
        {
            label: 'Menu',
            submenu: [
                {
                    label: 'Refresh',
                    click() {
                        win.reload()
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    click() {
                        app.quit()
                    }
                }
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click() {
                        console.log('Hello World!')
                    }
                }
            ]
        }
    ])

    Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// locations
ipcMain.on(channels.APP_INFO, (event) => {
    connection(function ({ success }) {
        event.sender.send(channels.APP_INFO, {
            appName: app.getName(),
            appVersion: app.getVersion(),
            appConnection: success,
        })
    })
})

ipcMain.on(channels.LOAD_BUILDINGS, async (event) => {
    await LocationDao.loadBuildings(function (bs) {
        const bsArray = bs.map(b => {
            const bID = b.bID
            const id = b._id.toString()
            return ({ bID, id })
        })
        event.sender.send(channels.LOAD_BUILDINGS, bsArray)
    })
})

ipcMain.on(channels.ADD_BUILDING, async (event, arg) => {
    const { newBuilding } = arg;
    await LocationDao.addBuilding(newBuilding, function (b) {
        if (b)
            event.sender.send(channels.ADD_BUILDING, {
                success: true
            })
        else
            event.sender.send(channels.ADD_BUILDING, {
                success: false
            })
    })
})

ipcMain.on(channels.ADD_ROOM, async (event, arg) => {
    const { newRoomID, roomType, buildingID, capacity } = arg
    await LocationDao.addRoom(newRoomID, roomType, buildingID, capacity, function (r) {
        if (r)
            event.sender.send(channels.ADD_ROOM, {
                success: true
            })
        else
            event.sender.send(channels.ADD_ROOM, {
                success: false
            })
    })
})

ipcMain.on(channels.LOAD_ROOMS, async (event) => {
    await LocationDao.loadRooms(function (rs) {
        const rsArray = rs.map(r => {
            const rID = r.rID
            const rType = r.rType
            const bID = r.bID
            const capacity = r.capacity
            const id = r._id.toString()
            return ({ rID, rType, bID, capacity, id })
        })
        event.sender.send(channels.LOAD_ROOMS, rsArray)
    })
})

ipcMain.on(channels.SEARCH_ROOMS, async (event, arg) => {
    const { keyword } = arg
    await LocationDao.searchRooms(keyword, function (rs) {
        const rsArray = rs.map(r => {
            const rID = r.rID
            const rType = r.rType
            const bID = r.bID
            const capacity = r.capacity
            const id = r._id.toString()
            return ({ rID, rType, bID, capacity, id })
        })
        event.sender.send(channels.SEARCH_ROOMS, rsArray)
    })
})

ipcMain.on(channels.DELETE_ROOM, async (event, arg) => {
    const { selected } = arg
    await LocationDao.deleteRoom(selected, function (r) {
        const { success } = r
        event.sender.send(channels.DELETE_ROOM, {
            success: success
        })
    })
})

ipcMain.on(channels.EDIT_ROOM, async (event, arg) => {
    const { newRoomID, roomType, buildingID, capacity, lid } = arg
    await LocationDao.editRoom(newRoomID, roomType, buildingID, capacity, lid, function (r) {
        const { success } = r
        event.sender.send(channels.EDIT_ROOM, {
            success: success
        })
    })
})

// subjects
ipcMain.on(channels.LOAD_SUBJECTS, async (event) => {
    await SubjectDao.loadSubjects(function (rs) {
        const subArray = rs.map(r => {
            const subCode = r.subCode
            const year = r.year
            const sem = r.sem
            const name = r.name
            const lecHrs = r.lecHrs
            const tuteHrs = r.tuteHrs
            const labHrs = r.labHrs
            const evalHrs = r.evalHrs
            const id = r._id.toString()
            return ({ subCode, year, sem, name, lecHrs, tuteHrs, labHrs, evalHrs, id })
        })
        event.sender.send(channels.LOAD_SUBJECTS, subArray)
    })
})

ipcMain.on(channels.EDIT_SUBJECT, async (event, arg) => {
    const { subjectCode, subYear, subSem, subName, subLecHrs, subTuteHrs, subLabHrs, subEvalHrs, id } = arg
    await SubjectDao.editSubject
        (subjectCode, subYear, subSem, subName, subLecHrs, subTuteHrs, subLabHrs, subEvalHrs, id, function (r) {
            const { success } = r
            event.sender.send(channels.EDIT_SUBJECT, {
                success: success
            })
        })
})

ipcMain.on(channels.DELETE_SUBJECT, async (event, arg) => {
    const { selected } = arg
    await SubjectDao.deleteSubject(selected, function (r) {
        const { success } = r
        event.sender.send(channels.DELETE_SUBJECT, {
            success: success
        })
    })
})

ipcMain.on(channels.ADD_SUBJECT, async (event, arg) => {
    const { subjectCode, subYear, subSem, subName, subLecHrs, subTuteHrs, subLabHrs, subEvalHrs } = arg
    await SubjectDao.addSubject
        (subjectCode, subYear, subSem, subName, subLecHrs, subTuteHrs, subLabHrs, subEvalHrs, function (r) {
            if (r)
                event.sender.send(channels.ADD_SUBJECT, {
                    success: true
                })
            else
                event.sender.send(channels.ADD_SUBJECT, {
                    success: false
                })
        })
})

//Schedule (Supuni's)

ipcMain.on(channels.ADD_SCHEDULE, async (event, arg) => {
    const { dayCount, workingDays,stime, duration,wtime } = arg
    await ScheduleDao.addSchedule(dayCount, workingDays,stime, duration,wtime , function (r) {
        if (r)
            event.sender.send(channels.ADD_SCHEDULE, {
                success: true
            })
        else
            event.sender.send(channels.ADD_SCHEDULE, {
                success: false
            })
    })
})

ipcMain.on(channels.LOAD_SCHEDULE, async (event) => {
    await ScheduleDao.loadSchedules(function (sh) {
        const shArray = sh.map(r => {
            const dayCount = r.working_days_count
            const workingDays = r.working_days
            const stime = r.starting_time
            const duration = r.Working_duration
            const wtime = r.Working_time
            const _id = r._id.toString()
           
            return ({_id, dayCount, workingDays,stime, duration,wtime })
        })
        event.sender.send(channels.LOAD_SCHEDULE, shArray)
    })
})

ipcMain.on(channels.SEARCH_SCHEDULE, async (event, arg) => {
    const { keyword } = arg
    await ScheduleDao.searchSchedules(keyword, function (sh) {
        const shArray = sh.map(r => {
            const dayCount = r.working_days_count
            const workingDays = r.working_days
            const stime = r.starting_time
            const duration = r.Working_duration
            const wtime = r.Working_time
            const _id = r._id.toString()
           
            return ({_id, dayCount, workingDays,stime, duration,wtime })
        })
        event.sender.send(channels.SEARCH_SCHEDULE, shArray)
    })
})

ipcMain.on(channels.DELETE_SCHEDULE, async (event, arg) => {
    const { selected } = arg
    await ScheduleDao.deleteSchedule(selected, function (sh) {
        const { success } = sh
        event.sender.send(channels.DELETE_SCHEDULE, {
            success: success
        })
    })
})

ipcMain.on(channels.EDIT_SCHEDULE, async (event, arg) => {
    const { _id, edayCount, eworkingDays,estime, eduration,ewtime } = arg
    await ScheduleDao.editSchedule(_id, edayCount, eworkingDays,estime, eduration,ewtime, function (sh) {
        const { success } = sh
        event.sender.send(channels.EDIT_SCHEDULE, {
            success: success
        })
    })
})

//lecturer
ipcMain.on(channels.LOAD_LECTURERS, async (event) => {
    await LecturerDao.loadLecturers(function (rs) {
        const rsArray = rs.map(r => {
            const eId = r.eId
            const name = r.name
            const faculty = r.faculty
            const dep = r.dep
            const center = r.center
            const building = r.building
            const level = r.level
            const rank = r.rank
            const id = r._id.toString()
            return ({ eId, name, faculty, dep, center, building, level, rank, id })
        })
        event.sender.send(channels.LOAD_LECTURERS, rsArray)
    })
})

ipcMain.on(channels.ADD_LECTURER, async (event, arg) => {
    const { eId, name, faculty, dep, center, building, level, rank } = arg;
    await LecturerDao.addLecturer(eId, name, faculty, dep, center, building, level, rank, function (b) {
        if (b)
            event.sender.send(channels.ADD_LECTURER, {
                success: true
            })
        else
            event.sender.send(channels.ADD_LECTURER, {
                success: false
            })
    })
})

ipcMain.on(channels.DELETE_LECTURERS, async (event, arg) => {
    const { selected } = arg
    await LecturerDao.deleteLecturer(selected, function (r) {
        const { success } = r
        event.sender.send(channels.DELETE_LECTURERS, {
            success: success
        })
    })
})

ipcMain.on(channels.EDIT_LECTURERS, async (event, arg) => {
    const { eId, name, faculty, dep, center, building, level, rank, id } = arg
    await LecturerDao.editLecturer(eId, name, faculty, dep, center, building, level, rank, id, function (r) {
        const { success } = r
        event.sender.send(channels.EDIT_LECTURERS, {
            success: success
        })
    })
})

//sessions tags
ipcMain.on(channels.LOAD_SESSIONS, async (event) => {
    await SessionDao.loadSessions(function (rs) {
        const subArray = rs.map(r => {
            const lecName = r.lecName
            const tag = r.tag
            const subName = r.subName
            const subCode = r.subCode
            const groupIdSub = r.groupIdSub
            const studentCount = r.studentCount
            const Duration = r.Duration
            const id = r._id.toString()
            return ({ lecName, tag, subName, subCode, groupIdSub, studentCount, Duration, id })
        })
        event.sender.send(channels.LOAD_SESSIONS, subArray)
    })
})

ipcMain.on(channels.ADD_SESSION, async (event, arg) => {
    const { lecNames, tag, subName, subCode, groupIdSub, studentCount, Duration } = arg
    await SessionDao.addSession
    (lecNames, tag, subName, subCode, groupIdSub, studentCount, Duration, function (r) {
        if (r)
            event.sender.send(channels.ADD_SESSION, {
                success: true
            })
        else
            event.sender.send(channels.ADD_SESSION, {
                success: false
            })
    })
})

ipcMain.on(channels.DELETE_SESSION, async (event, arg) => {
    const { selected } = arg
    await SessionDao.deleteSession(selected, function (r) {
        const { success } = r
        event.sender.send(channels.DELETE_SESSION, {
            success: success
        })
    })
})

ipcMain.on(channels.LOAD_TAGS, async (event) => {
    await TagDao.loadTags(function (rs) {
        const rsArray = rs.map(r => {
            const name = r.name
            const id = r._id.toString()
            return ({ name, id })
        })
        event.sender.send(channels.LOAD_TAGS, rsArray)
    })
})

ipcMain.on(channels.SEARCH_SESSIONS, async (event, arg) => {
    const { keyword } = arg
    await SessionDao.searchSessions(keyword, function (se) {
        const seArray = se.map(s => {
            const lecName = s.lecName
            const tag = s.tag
            const subName = s.subName
            const subCode = s.subCode
            const groupIdSub = s.groupIdSub
            const studentCount = s.studentCount
            const Duration = s.Duration
            const id = s._id.toString()
            return ({ lecName, tag, subName, subCode, groupIdSub, studentCount, Duration, id })
        })
        event.sender.send(channels.SEARCH_SESSIONS, seArray)
    })
})

//students

ipcMain.on(channels.LOAD_STUDENTS_FOR_TT, async (event) => {
    await StudentDao.loadStudents(function (rs) {
        const rsArray = rs.map(r => {
            const year = r.year
            const sem = r.sem
            const programme = r.programme
            const group = r.group
            const subGroup = r.subGroup
            const subGroupIdLabel=r.subGroupIdLabel
            const groupIdLabel= r.groupIdLabel
            const id = r._id.toString()
            return ({ year, sem, programme, group, subGroup,subGroupIdLabel,groupIdLabel,id })
        })
        event.sender.send(channels.LOAD_STUDENTS_FOR_TT, rsArray)
    })
})

//load sessions
ipcMain.on(channels.LOAD_SESSIONS, async (event) => {
    await SessionDao.loadSessions(function (rs) {
        const subArray = rs.map(r => {
            const lecName = r.lecName
            const tag = r.tag
            const subName = r.subName
            const subCode = r.subCode
            const groupIdSub = r.groupIdSub
            const studentCount = r.studentCount
            const Duration = r.Duration
            const id = r._id.toString()
            return ({ lecName, tag, subName, subCode, groupIdSub, studentCount, Duration, id })
        })
        event.sender.send(channels.LOAD_SESSIONS, subArray)
    })
})
