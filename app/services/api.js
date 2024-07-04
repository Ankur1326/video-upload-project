import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://upload.lykstage.com:9092';

export const getJwtToken = async (userId = "40672") => {
    try {
        const response = await axios.post(`${BASE_URL}/noauth/tkn`, { userId });
        const token = response.data.response.access_token;

        // console.log("token: ", token);
        await AsyncStorage.setItem('token', token);
        return token;
    } catch (error) {
        console.error('Error getting JWT token:', error);
    }
}

export const initiateUpload = async (fileName, fileType, size, totalChunks) => {
    try {
        const token = await AsyncStorage.getItem("token")

        const response = await axios.post(
            `${BASE_URL}/mob/initUp`,
            { fileName, fileType, size, totalChunks },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        // console.log(response.data.response.fileToken);

        return response.data.response.fileToken;

    } catch (error) {
        console.log('Error initiating upload:', error);
    }
}

export const getUploadUrl = async (fileToken, partNumber) => {
    console.log();
    try {
        const token = await AsyncStorage.getItem("token")
        const response = await axios.post(
            `${BASE_URL}/mob/getUpUrl`,
            { fileToken, partNumber },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        // console.log(response.data);
        return response.data.response.url;
    } catch (error) {
        console.log('Error while getting upload URL:', error);
    }
}

export const completeUpload = async (fileToken, parts) => {
    try {
        const token = await AsyncStorage.getItem("token")
        const response = await axios.post(
            `${BASE_URL}/mob/finishUp`,
            { fileToken, parts },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        return response.data;
    } catch (error) {
        console.log("Error while completing upload file : ", error);
    }
}