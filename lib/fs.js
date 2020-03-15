// Requires: Packages
const fs = require('fs')

// Variables
const labelsDefault = [
    {
        "name": "(ノಠ益ಠ)ノ彡┻━┻",
        "color": "FC271E",
        "description": "For that one time. You'll know when that is."
    },
    {
        "name": "File: name_of_file.ext :file_folder:",
        "color": "4F86C6",
        "description": "Everything name_of_file.ext related."
    },
    {
        "name": "Duplicate :heavy_multiplication_x:",
        "color": "D2DAE1",
        "description": "It's a dupe, duh."
    },
    {
        "name": "Good first issue :ok_hand:",
        "color": "4F86C6",
        "description": "If you're new here, check this out!"
    },
    {
        "name": "Help wanted :raised_hands:",
        "color": "A1EF8B",
        "description": "I'm desperate. Please help a poor soul."
    },
    {
        "name": "Priority: High :fire:",
        "color": "FC271E",
        "description": "Oh no..."
    },
    {
        "name": "Priority: Low :snowflake:",
        "color": "008000",
        "description": "Don't worry. At least for now. But don't forget about it!"
    },
    {
        "name": "Priority: Medium :tornado:",
        "color": "FFFF32",
        "description": "You should probably go take a look. Maybe this week still?"
    },
    {
        "name": "Status: Acknowledged :v:",
        "color": "A18276",
        "description": "Did you really though? Don't forget about it!"
    },
    {
        "name": "Status: Done :heavy_check_mark:",
        "color": "008000",
        "description": "I hope you actually did something well this time."
    },
    {
        "name": "Status: In Progress :clock1030:",
        "color": "ff8000",
        "description": "Tell them you're working on it. They'll believe you!"
    },
    {
        "name": "Status: Review Needed :thinking:",
        "color": "FFFF32",
        "description": "Don't try to do things alone, go check it out! It's probably good."
    },
    {
        "name": "Type: Bug :beetle:",
        "color": "FC271E",
        "description": "It's a bug. Easy. Fix it."
    },
    {
        "name": "Type: Enhancement :arrow_double_up:",
        "color": "4F86C6",
        "description": "Somebody says your code could be better! They're probably right."
    },
    {
        "name": "Type: Feature Request :green_heart:",
        "color": "008000",
        "description": "Yay, people actually care about this project!"
    },
    {
        "name": "Type: Question :question:",
        "color": "D2DAE1",
        "description": "You've told yourself you'd answer every single one. Go do it."
    },
    {
        "name": "Type: TODO :memo:",
        "color": "ff8000",
        "description": "Let me guess: there are a lot?"
    }
]

/* --- Functions --- */
// Checks if file exists, and if not creates it with default labels
function fileExists(file) {
    if (!fs.existsSync(file)) return false
    else return true
}

// Returns labels.json file
function readSync(file) {
    if (!fileExists(file)) {
        if (hasPermission('write', getFolderOfFilePath(file))) fs.writeFileSync(file, JSON.stringify(labelsDefault, null, 4))
        else console.error("Labeler needs permissions. Please run as admin/sudo!")
    }
    return JSON.parse(fs.readFileSync(file))
}

// Writes file
function writeSync(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4), function (err) {
        if (err) throw err
        return true
    });
}

// Deletes a file
function deleteSync(file) {
    if (fileExists(file)) fs.unlinkSync(file)
}

// Check for permission
function hasPermission(permission, path) {
    switch (permission) {
        case 'read':
            permission = fs.constants.R_OK
            break
        case 'write':
            permission = fs.constants.W_OK
            break
        case 'execute':
            permission = fs.constants.X_OK
            break
    }
    try {
        fs.accessSync(path, permission)
        return true
    } catch (err) {
        throw err
    }
}

// Return path from a file. Ex: getFolderOfFilePath('path/to/file.txt') -> 'path/to'
function getFolderOfFilePath(path) {
    return path.substring(0, path.lastIndexOf('/'))
}

// Exports
module.exports = {
    readSync: readSync,
    writeSync: writeSync,
    deleteSync: deleteSync,
    hasPermission: hasPermission,
    getFolderOfFilePath: getFolderOfFilePath
}