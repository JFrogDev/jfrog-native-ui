
import PackagesNativeController from "./packages.native.controller";

export default class PackagesNativeComponent {
    constructor() {
        this.template = require('./packages.native.view.html');
        this.controller = PackagesNativeController;
        this.bindings = {
            packageType: '<',
            getPackageTypes: '&?',
            getFilters: '&?',
            getPackages: '&?',
            getPackage: '&?',
	        getPackageExtraInfo: '&?',
	        getPackageDownloadsCount: '&?',
            getVersion: '&?',
	        getVersionDownloadsCount: '&?',
            getManifest: '&?',
	        isWithXray: '&?',
	        showInTree: '&?',
        };
    }
}