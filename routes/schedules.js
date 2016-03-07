'use strict';
let express = require('express');
let router = express.Router();
let authenticationEnsurer = require('./authendication-ensurer');
let uuid = require('node-uuid');
let Schedule = require('../models/schedule');
let Candidate = require('../models/candidate');
let User = require('../models/user');

router.get('/new', authenticationEnsurer, (req, res, next) => {
  res.render('new', { user: req.user });
});

router.post('/', authenticationEnsurer, (req, res, next) => {
  let scheduleId = uuid.v4();
  let updatedAt = new Date();
  Schedule.create({
    scheduleId: scheduleId,
    scheduleName: req.body.scheduleName.slice(0, 255),
    memo: req.body.memo,
    createdBy: req.user.id,
    updatedAt: updatedAt
  }).then((schedule) => {
    let candidateNames = req.body.candidates.trim().split('\n').map((s) => s.trim());
    let candidates = candidateNames.map((c) => { return {
      candidateName: c,
      scheduleId: schedule.scheduleId
    };});
    Candidate.bulkCreate(candidates).then(() => {
          res.redirect('/schedules/' + schedule.scheduleId);
    });
  });
});

router.get('/:scheduleId', authenticationEnsurer, (req, res, next) => {
  Schedule.findOne({
    include: [
      {
        model: User,
        attributes: ['userId', 'username']
      }],
    where: {
      scheduleId: req.params.scheduleId
    },
    order: '"updatedAt" DESC'
  }).then((schedule) => {
    if (schedule) {
      Candidate.findAll({
        where: { scheduleId: schedule.scheduleId },
        order: '"candidateId" ASC'
      }).then((candidates) => {
         res.render('schedule', {
              user: req.user,
              schedule: schedule,
              candidates: candidates,
              users: [req.user]
            });
      });
    } else {
      let err = new Error('指定された予定は見つかりません');
      err.status = 404;
      next(err);
    }
  });
});
module.exports = router;