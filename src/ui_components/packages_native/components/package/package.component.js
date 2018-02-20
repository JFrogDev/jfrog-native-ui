
import PackageController from "./package.controller";

export default class PackageComponent {
    constructor() {
        this.template = require('./package.view.html');
        this.controller = PackageController;
        this.bindings = {
            packageType: '<',
            package: '<',
            getManifest: '&?',
            refreshPackage: '&?',
	        isWithXray: '&?',
	        showInTree: '&?'
        };
    }
}