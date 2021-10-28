import { RegisterCreatePayloadWithoutAuthId } from "./admin-payload.mock"

export const AdminControllerMock = {
    // ==================================== service ====================================
    findOne: jest.fn().mockImplementation((auth_id) => { return { auth_id: auth_id.auth_id, id: expect.any(String), ...RegisterCreatePayloadWithoutAuthId } }),
    updateOne: jest.fn().mockImplementation((id, dto) => { return { id: id.id, ...dto } })
}