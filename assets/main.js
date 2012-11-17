/*
 * LibrePlan App
 *
 * Copyright (C) 2012  Manuel Rego Casasnovas <rego@igalia.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Boun user web services path
var PATH = 'ws/rest/bounduser/';

// Global vars
var url;
var username;
var baseAuth;
var projects;
var timesheetsEntries;
var selectedTask;

var finishedTasks = false;

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    reloadStoredConfiguration();
    setConfigurationInputs();
    updateFinishedTasksButtonsVisibility();
    refreshTasksList();
}

function updateFinishedTasksButtonsVisibility() {
    if (finishedTasks) {
        $("#show-finished").hide();
        $("#hide-finished").show();
    } else {
        $("#show-finished").show();
        $("#hide-finished").hide();
    }
}

function isOnline() {
    var networkState = navigator.network.connection.type;
    return (networkState != Connection.NONE);
}

function makeBaseAuth(user, password) {
    var token = user + ':' + password;
    var hash = btoa(token);
    return 'Basic ' + hash;
}

function offLineCallback() {
	refreshTasksList();
}

function refreshTasksList() {
    if (!isOnline()) {
        navigator.notification.alert(
                'Sorry but you have to be on-line in order to use LibrePlan App',
                offLineCallback,
                'Off-line',
                'Ok'
            );
        return;
    }

    $.mobile.loading('show', {
        text: 'Loading tasks list',
        textVisible: true,
    });

    serviceUrl = url + PATH + 'mytasks';

    $.ajax({
        type: 'GET',
        url: serviceUrl,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', baseAuth);
        }
    }).done(function(data) {
        var tasksList = data.firstChild;

        projects = new Array();

        for (i = 0; i < tasksList.childNodes.length; i++) {
            var taskData = tasksList.childNodes[i];

            projectCode = taskData.getAttribute('project-code');
            var project = findProjectByCode(projectCode);

            if (!project) {
                project = {
                    code: projectCode,
                    name: taskData.getAttribute('project-name'),
                    allTasksFinished: true,
                    tasks: new Array(),
                    unfinishedTasks: 0,
                };
                projects.push(project);
            }

            var task = {
                    name: taskData.getAttribute('name'),
                    code: taskData.getAttribute('code'),
                    startDate: taskData.getAttribute('start-date'),
                    endDate: taskData.getAttribute('end-date'),
                    effort: taskData.getAttribute('effort'),
                    progressValue: taskData.getAttribute('progress-value'),
                    progressDate: taskData.getAttribute('progress-date'),
            };

            if (!isTaskFinished(task)) {
                project.allTasksFinished = false;
                project.unfinishedTasks++;
            }

            project.tasks.push(task);
        }

        fillTaskLists();

        $.mobile.loading('hide');
    }).fail(function() {
        $.mobile.loading('hide');

        navigator.notification.alert(
            'Problems connecting to LibrePlan server',
            goToConfiguration,
            'Error',
            'Ok'
        );
    });
}

function findProjectByCode(projectCode) {
    for (var i = 0; i < projects.length; i++) {
        if (projects[i].code == projectCode) {
            return projects[i];
        }
    }
    return null;
}

function fillTaskLists() {
    var list = $('#tasks-list');
    list.html('');

    for (var i = 0; i < projects.length; i++) {
        var project = projects[i];
        if (!finishedTasks && project.allTasksFinished) {
            continue;
        }

        list.append(createLiProject(project));

        for (var j = 0; j < project.tasks.length; j++) {
            var task = project.tasks[j];
            if (!finishedTasks) {
                if (isTaskFinished(task)) {
                    continue;
                }
            }
            list.append(createLiTask(task));
        }
    }

    list.listview('destroy').listview();
}

function isTaskFinished(task) {
    var progress = task.progressValue;
    if (!progress) {
        return false;
    }
    return parseInt(progress) == "100";
}

function createLiProject(project) {
    var li = $('<li data-role="list-divider" />');
    var tasksNumber = finishedTasks ? project.tasks.length : project.unfinishedTasks;
    li.html(project.name + ' <span class="ui-li-count">' + tasksNumber + '</span>');
    return li;
}

function createLiTask(task) {
    var a = $('<a onClick="showTimesheets(\'' + task.code + '\', \'' + task.name + '\');" />');
    $('<h3 />').append(task.name).appendTo(a);
    $('<p />').append($('<strong />').append('Effort: ' + task.effort)).appendTo(a);
    $('<p />').append('Dates: ' + task.startDate + ' - ' + task.endDate).appendTo(a);
    $('<p class="ui-li-aside" />').append(toPercentage(task.progressValue)).appendTo(a);

    var li = $('<li />');
    li.append(a);
    return li;
}

function toPercentage(progress) {
    if (!progress) {
        progress = 0;
    }
    return parseInt(progress) + ' %';
}

function saveConfiguration() {
    var url = $('#url').val();
    window.localStorage.setItem('url', url);

    var username = $('#username').val();
    window.localStorage.setItem('username', username);

    var password = $('#password').val();
    var baseAuth = makeBaseAuth(username, password);
    window.localStorage.setItem('baseAuth', baseAuth);

    reloadStoredConfiguration();
    refreshTasksList();
}

function reloadStoredConfiguration() {
    url = window.localStorage.getItem('url');
    username = window.localStorage.getItem('username');
    baseAuth = window.localStorage.getItem('baseAuth');
}

function setConfigurationInputs() {
    $('#url').val(url);
    $('#username').val(username);
}

function goToConfiguration() {
    $.mobile.changePage('#configuration');
}

function showFinished() {
    finishedTasks = true;
    updateFinishedTasksButtonsVisibility();
    fillTaskLists();
}

function hideFinished() {
    finishedTasks = false;
    updateFinishedTasksButtonsVisibility();
    fillTaskLists();
}

function showTimesheets(taskCode, taskName) {
    $.mobile.changePage('#timesheets');

    $.mobile.loading('show', {
        text: 'Loading timesheets',
        textVisible: true,
    });

    selectedTask = taskCode;

    serviceUrl = url + PATH + 'timesheets/' + taskCode;

    $.ajax({
        type: 'GET',
        url: serviceUrl,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', baseAuth);
        }
    }).done(function(data) {
        var entriesList = data.firstChild;

        timesheetsEntries = new Array();

        for (i = 0; i < entriesList.childNodes.length; i++) {
            var entry = entriesList.childNodes[i];

            var timesheetEntry = {
                    date: entry.getAttribute('date'),
                    effort: entry.getAttribute('effort'),
                    task: entry.getAttribute('task'),
            };

            timesheetsEntries.push(timesheetEntry);
        }

        $('#timesheets-task').html(taskName);
        fillTimesheetsList();

        $.mobile.loading('hide');
    }).fail(function() {
        $.mobile.loading('hide');

        navigator.notification.alert(
            'Problems loading timesheets for task "' + taskName + '"',
            null,
            'Error',
            'Ok'
        );
    });
}

function fillTimesheetsList() {
    var list = $('#timesheets-list');
    list.html('');

    $('#saveTimesheetEntries').hide();

    if (timesheetsEntries.length == 0) {
        $('#timesheets-list-empty').show();
        list.hide();
    } else {
        $('#timesheets-list-empty').hide();
        list.show();

        for (var i = 0; i < timesheetsEntries.length; i++) {
            var entry = timesheetsEntries[i];
            if (entry.effort != "0") {
                list.append(createLiTimesheetEntry(entry));
            }
        }
    }

    list.listview('destroy').listview();
}

function createLiTimesheetEntry(entry) {
    var li = $('<li />');

    $('<a />').append(entry.date).appendTo(li);
    $('<span class="ui-li-count" />').append(entry.effort).appendTo(li);

    var index = timesheetsEntries.indexOf(entry);
    $('<a onClick="removeTimesheetEntry(\'' + index + '\');" />').append('Delete').appendTo(li);

    return li;
}

function removeTimesheetEntry(index) {
    timesheetsEntries[index].effort = "0";
    refreshTimesheetsListAndShowSaveButton();
}

function addTimesheetEntry() {
    var entry = findTimesheetEntryByDate($('#date').val());

    if (entry == null) {
        entry = {
                date: $('#date').val(),
                effort: $('#effort').val(),
                task: selectedTask,
        };
        timesheetsEntries.unshift(entry);
    } else {
        entry.effort = $('#effort').val();
    }

    refreshTimesheetsListAndShowSaveButton();
}

function findTimesheetEntryByDate(date) {
    for (var i = 0; i < timesheetsEntries.length; i++) {
        if (timesheetsEntries[i].date == date) {
            return timesheetsEntries[i];
        }
    }
    return null;
}

function refreshTimesheetsListAndShowSaveButton() {
    fillTimesheetsList();
    $('#saveTimesheetEntries').show();
}

function generateTimesheetsEntriesXML() {
    var root = $('<personal-timesheet-entry-list />');
    for (var i = 0; i < timesheetsEntries.length; i++) {
        var entry = timesheetsEntries[i];
        $('<personal-timesheet-entry effort="' + entry.effort + '" date="' + entry.date + '" task="' + entry.task + '" />').appendTo(root);
    }

    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<personal-timesheet-entry-list xmlns="http://rest.ws.libreplan.org">'
        + root.html()
        + '</personal-timesheet-entry-list>';
    return xml;
}

function saveTimesheetsEntries() {
    $.mobile.loading('show', {
        text: 'Saving timesheets',
        textVisible: true,
    });

    var xml = generateTimesheetsEntriesXML();

    serviceUrl = url + PATH + 'timesheets/';

    $.ajax({
        type: 'POST',
        url: serviceUrl,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', baseAuth);
        },
        data: xml,
        contentType: 'text/xml',
        dataType: 'text',
    }).done(function(data) {
        $.mobile.loading('hide');

        navigator.notification.alert(
                'Changes saved into LibrePlan server',
                null,
                'Information',
                'Ok'
            );
    }).fail(function() {
        $.mobile.loading('hide');

        navigator.notification.alert(
                'Problems sending timesheets data to LibrePlan server',
                null,
                'Error',
                'Ok'
            );
    });
}

function setupAddTimesheetEntryPopup() {
    $('#date').scroller('destroy');
    $('#date').scroller({
        preset: 'date',
        theme: 'jqm',
        display: 'inline',
        mode: 'scroller',
        dateFormat: 'yyyy-mm-dd',
        dateOrder: 'yyyy-mm-dd'
    });
    $('#date').scroller('setDate', new Date(), true);

    $('#effort').scroller('destroy');
    $('#effort').val('0:00');
    $('#effort').scroller({
        preset: 'time',
        theme: 'jqm',
        display: 'inline',
        mode: 'scroller',
        timeFormat: 'H:ii',
        timeWheels: 'H:ii'
    });
}