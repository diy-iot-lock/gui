import {Injectable} from '@angular/core';


@Injectable({ providedIn: 'root'})
export class ConfigService {

    public faceUrl = "https://api-bypbwcpd7wiyc.azurewebsites.net";
    public faceKey = "0800c22e917e4b27b123f47557f40e66";

    public blobName = "storage0bypbwcpd7wiyc";
    public blobSAS  = "";

    constructor() {}
}
