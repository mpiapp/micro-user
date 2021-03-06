import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminUserRegisterDTO } from './dto/admin-user-register.dto';
import { AdminUser, AdminUserDocument } from './schema/admin.schema';
import * as requester from 'axios';
import * as dotenv from 'dotenv';
import { AdminUserCreateDTO } from './dto/admin-user-create.dto';
import { UserEmailDTO } from './dto/user-email.dto';
import { UpdateAdminDTO } from './dto/update-admin.dto';
import { AuthIdDTO } from './dto/auth_id.dto';

dotenv.config();

@Injectable()
export class AdminService {

    constructor( @InjectModel(AdminUser.name) private readonly adminUserModel:Model<AdminUserDocument> ) {}

    async getAll(): Promise<any> {
        return this.adminUserModel.find({})
    }

    async getProfile( auth_id: string ): Promise<any> {
        return this.adminUserModel.findOne({ auth_id })
    }

    async update(auth_id: AuthIdDTO, body: UpdateAdminDTO ): Promise<AdminUser> {
        await this.adminUserModel.updateOne(auth_id, body)
        return this.getProfile(auth_id.auth_id)
    }

    async registerCreate( user: AdminUserCreateDTO ): Promise<any> {
        return this.adminUserModel.create(user)
    }

    async register(body: AdminUserRegisterDTO): Promise<any> {
        const headersRequest = {
            'Content-Type': process.env.application_json,
            'Accept': process.env.application_json,
        };

        try {
            const registeredUser = await requester.default.post(`https://${process.env.AUTH0_ADMINUSER_BASE_URL}/dbconnections/signup`, {
                client_id: process.env.AUTH0_ADMINUSER_CLIENT_ID,
                connection: process.env.AUTH0_ADMINUSER_CONNECTION,
                email: body.email, 
                password: body.password
            }, { headers: headersRequest })

            return registeredUser.data

        } catch (error) {
            // console.log(error.response.data)
            return 'error'
        }
    }

    async login(body: AdminUserRegisterDTO): Promise<any> {
        try {
            let loginedUser = await requester.default.post(`https://${process.env.AUTH0_ADMINUSER_BASE_URL}/oauth/token`, {
                client_id: process.env.AUTH0_ADMINUSER_CLIENT_ID,
                connection: process.env.AUTH0_ADMINUSER_CONNECTION,
                scope: process.env.AUTH0_ADMINUSER_SCOPE,
                grant_type: process.env.AUTH0_ADMINUSER_GRANT_TYPE,
                username: body.email, 
                password: body.password
            })

            delete loginedUser.data['scope']
            return {
                message: 'Authorized',
                ...loginedUser.data
            }

        } catch (error) {
            // console.log(error.response.data)
            return {
                status: 'error',
                message: error.response.data && error.response.data["error_description"] ? error.response.data["error_description"] : ""
            }   
        }
    }

    async checkAccess(headers: object): Promise<any> {
        try {
            let token = headers["token"]
            const options = { headers: { Authorization: `Bearer ${token}` } }
            let auth0_response = await requester.default.post(`https://${process.env.AUTH0_ADMINUSER_BASE_URL}/userinfo`, null, options)

            /* istanbul ignore next */      // ignored for automatic give access to user
            return { 
                message: 'Authorized',
                email_verified: auth0_response.data.email_verified,
                auth_id: auth0_response.data.sub.split('|')[1],
                avatar: auth0_response.data.picture
            }
        } catch (error) {
            // console.log(error.response.data)
            return 'error'
        }
    }

    async changePassword(email: UserEmailDTO): Promise<any> {

        const payload = {
            client_id: process.env.AUTH0_ADMINUSER_CLIENT_ID,
            connection: process.env.AUTH0_ADMINUSER_CONNECTION,
            email: email['email'],
        }
        await requester.default.post(`https://${process.env.AUTH0_ADMINUSER_BASE_URL}/dbconnections/change_password`, payload)
        return { message: 'Link for password change sent to email' }
    }
    
}
