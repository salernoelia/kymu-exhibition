
export async function getAvailableVideoDevices(videoDevices: Ref<MediaDeviceInfo[]>, selectedDeviceId: Ref<string>) {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices.value = devices.filter(device => device.kind === 'videoinput');

        if (videoDevices.value.length > 0) {
            const faceTimeCamera = videoDevices.value.find(device =>
                device.label && device.label.toLowerCase().includes('facetime')
            );

            const realSenseCamera = videoDevices.value.find(device =>
                device.label && device.label.toLowerCase().includes('realsense') && device.label.toLowerCase().includes('rgb')
            );


            if (realSenseCamera) {
                selectedDeviceId.value = realSenseCamera.deviceId;
            } else if (faceTimeCamera) {
                selectedDeviceId.value = faceTimeCamera.deviceId;
            } else {
                selectedDeviceId.value = videoDevices.value[0].deviceId;
            }
        }
    } catch (error) {
        console.error("Error getting video devices:", error);
    }
}
