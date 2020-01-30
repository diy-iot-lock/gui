import {Injectable} from '@angular/core';


@Injectable({ providedIn: 'root'})
export class ConfigService {

    public faceUrl = "";
    public faceKey = "";

    public blobName = "";
    public blobSAS  = "";

    constructor() {}
}
