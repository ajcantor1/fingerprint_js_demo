import bcrypt from 'bcryptjs';

import User from '../models/user.js';

import LoginAttempt from '../models/loginattempt.js';

import _ from 'lodash';

import axios from "axios";

import moment from 'moment';

import {Sequelize} from 'sequelize';

import dotenv from "dotenv";

dotenv.config();

const createUser = (username, firstName, lastName, dateOfBirth, passwordHash) => {

    return new Promise((resolve, reject) => {
        const user = User.create(({
            username: username,
            firstName: firstName,
            lastName: lastName,
            dateOfBirth: dateOfBirth,
            password: passwordHash
        }));

        if (user) {
            return resolve(user)
        } else {
            reject(`Error creating user`)
        }
    });
}

const createLoginAttempt = (username, visitorId, passwordMatched, fingerprintData = null) => {

    return new Promise((resolve, reject) => {

        let loginAttempt = null;
        console.log(JSON.stringify(fingerprintData))
        if(fingerprintData && fingerprintData.visits.length > 0) {

            const mostRecentVisit = fingerprintData.visits[0]

            loginAttempt = LoginAttempt.create(({
                username: username,
                visitorId: visitorId,
                passwordMatched: passwordMatched,
                fingerprintFound: true,
                confidence: mostRecentVisit.confidence.score,
                ip: mostRecentVisit.ip,
                city: mostRecentVisit.ipLocation.city.name,
                country: mostRecentVisit.ipLocation.country.name,
            }));

        } else {
            
            loginAttempt = LoginAttempt.create(({
                username: username,
                visitorId: visitorId,
                passwordMatched: passwordMatched,
                fingerprintFound: false
            }));
        }

        if (loginAttempt) {
            return resolve(loginAttempt)
        } else {
            reject(`Error creating login Attempt`)
        }
    });
}


const register = async (req, res, next) => {

    try {

        if (req.body.username && req.body.password && req.body.confirmPassword && req.body.password == req.body.confirmPassword) {
            
            const dbUser = await User.findOne({ where : {username: req.body.username }});
            
            if(dbUser) {
                res.status(409).json({message: "username is already associated with account"});

            } else {
                //res.status(409).json({message: "username is already associated with account"});
                const passwordHash = await bcrypt.hash(req.body.password, 12);
                const user = await createUser(req.body.username, req.body.firstName, req.body.lastName, req.body.dateOfBirth, passwordHash);
                res.status(200).json({message: "user created"});
            }
            
         
        }
            
    } catch (error) {
        
        console.log(error)
        res.status(409).json({message: "username is already associated with account"});
    }
}

const validateAttempt = async(user, visitorId, passwordMatched, fingerprintData = null) => {
    
    try {

        const loginAttempt = await createLoginAttempt(user.dataValues.username, visitorId, passwordMatched, fingerprintData)
        
        const failedLoginAttempts = await LoginAttempt.count({
            where:
                Sequelize.and(
                    {username: user.username},  
                    {createdAt: 
                        { 
                            [Sequelize.Op.between] : 
                                [
                                    moment().subtract(5, 'minutes').toDate(),
                                    moment().toDate()
                                ] 
                        }
                    },            
                    Sequelize.or({fingerprintFound: false}, {passwordMatched: false})
                )
        });
        
        const exceeded5Attempts = failedLoginAttempts >= 5;
        const lockexpired = moment(user.lockedTill).isBefore(moment())

        let loginSuccess = 
            (!user.locked && loginAttempt.fingerprintFound && passwordMatched) ||
            (user.locked && loginAttempt.fingerprintFound && passwordMatched && lockexpired);


        if(loginSuccess) {
            
            if(user.locked) {
                await user.update({locked:false});
            } 

        } else {
            
            if(exceeded5Attempts) {
                await user.update({locked:true, lockedTill: moment().add(5, 'minutes')});
            }
        }

        return loginAttempt.fingerprintFound;
    
    } catch(error) {
        console.log(error)
    }
}

const login = async(req, res, next) => {
    
    try {
 
        let user = await User.findOne({ where : {username: req.body.username}});

        if (!user) {
            return res.status(401).json({message: "incorrect credentials"});
    
        } else {
            
            const fpResponse = await axios.get(`https://api.fpjs.io/visitors/${req.body.visitorId}?token=${process.env.API_KEY}`);

            const match  = await bcrypt.compare(req.body.password, user.dataValues.password);
            
            const fingerprintFound = await validateAttempt(user, req.body.visitorId, match, fpResponse.data) 
            
            if(user.locked) {
                return res.status(401).json({message: "Account temporary locked due too many failed login attempts"});
            } else if(match && fingerprintFound  && !user.locked) {
                return res.status(200).json({message: "Successfully logged in"}); 
            } else if(!match){
                return res.status(401).json({message: "Invalid credentials"});
            } else if(!fingerprintFound) {
                return res.status(401).json({message: "Unable to login, suspicious activity and/or interference with your login in attempt"});
            } else {
                return res.status(401).json({message: "Something went wrong"});
            }
        }

    }catch(error) {
        console.log(error)
        return res.status(401).json({message: "Something went wrong"});
    }
};

export { register, login };