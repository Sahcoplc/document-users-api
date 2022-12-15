import axios from 'axios'
import { config } from '../config/config.js'

export const fetchProfile = async (accessToken) => {

    try {
       const { data } = await axios.get(config.resourceApi.endpoint, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
       }) 

       return data
       
    } catch (err) {
        console.log(err)
    }
}