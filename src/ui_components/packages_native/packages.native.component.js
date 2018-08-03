
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
            getPackageSummary: '&?',
	        getPackageExtraInfo: '&?',
	        getPackageDownloadsCount: '&?',
            getVersion: '&?',
            getVersionSummary: '&?',
	        getVersionDownloadsCount: '&?',
            getManifest: '&?',
	        isWithXray: '&?',
	        showInTree: '&?',
        };
    }
}