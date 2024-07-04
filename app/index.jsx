import { Text, View, TextInput, StyleSheet, Button, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { completeUpload, getJwtToken, getUploadUrl, initiateUpload } from "./services/api"
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system';
import axios from "axios";
import { Buffer } from "buffer"

export default function Index() {
  const [fileInfo, setFileInfo] = useState();

  // useEffect(() => {
  //   getJwtToken()
  // }, [])

  const handleFilePick = async () => {
    let result = await DocumentPicker.getDocumentAsync({})
    if (!result.canceled) {
      const { mimeType, name, size, uri } = result.assets[0] //{ mimeType, name, size, uri }
      setFileInfo({ mimeType, name, size, uri })
    } else {
      console.log('Cancelled');
    }
  }

  const handleUpload = async () => {
    const token = await getJwtToken()
    const { name, size, uri } = fileInfo
    const fileType = 'video/mp4';
    const chunkSize = 5;
    const totalChunks = Math.ceil(size / (chunkSize * 1024 * 1024));
    // if file size is 5 so total chunks 1 
    // if file size is 15 so total chunks 3 and so on. (each chunk would be 5MB)

    const fileToken = await initiateUpload(name, fileType, size, totalChunks);

    const etags = []; // to store ETags

    // console.log("token :: ", token);
    // console.log("name, size, uri : ", name, size, uri);
    // console.log("totalChunks : ", totalChunks);
    // console.log("fileToken : ", fileToken);

    for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
      const uploadUrl = await getUploadUrl(fileToken, partNumber)

      // calculate start and end bytes
      const start = (partNumber - 1) * chunkSize; // where the current chunk start.
      const end = partNumber * chunkSize > size ? size : partNumber * chunkSize; // where the current chunk ends.

      // Read the chunk data from the file
      const chunk = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64, // convert binary data into a text string
        position: start, // starting position 
        length: end - start,
      });

      // console.log("start : ", start);
      // console.log("end : ", end);
      // console.log("chunk : ", chunk);

      // Convert base64 to binary data
      const binaryData = Buffer.from(chunk, 'base64');
      console.log("binaryData : ", binaryData);

      // Upload the chunk
      const response = await axios.put(uploadUrl, binaryData, {
        headers: {
          'Content-Length': binaryData.length
        }
      })

      // get eTags from the response headers
      const etag = response.headers.get('ETag')
      etag.push({ ETag: etag, PartNumber: partNumber })

      console.log(`Uploaded chunk ${partNumber}/${totalChunks}`);

    }
    const completionResponse = await completeUpload(fileToken, etags)
    console.log("Upload complete : ", completionResponse);

  }

  return (
    <View style={styles.container} >
      <TextInput
        style={styles.input}
        placeholder="Enter User ID"
      // value={userId}
      // onChangeText={setUserId}
      />
      <TouchableOpacity style={styles.pichFileBtn} onPress={handleFilePick}>
        <Text style={styles.btnText}>
          Pich a file
        </Text>
      </TouchableOpacity>
      {
        fileInfo && (
          <View style={styles.fileInfo}>
            <Text>{fileInfo.name}</Text>
            <Text>{fileInfo.size.toFixed(2)} MB</Text>
          </View>
        )
      }
      <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
        <Text style={styles.btnText}>
          Upload File
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
  },
  fileInfo: {
    marginBottom: 16,
  },
  uploadBtn: {
    backgroundColor: "green",
    alignItems: "center"
  },
  pichFileBtn: {
    backgroundColor: "#2684FC",
    alignItems: "center"
  },
  btnText: {
    color: "#ffffff",
    fontWeight: 'bold',
    paddingVertical: 9,
  }
})