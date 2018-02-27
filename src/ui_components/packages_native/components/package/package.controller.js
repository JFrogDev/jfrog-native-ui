import {PACKAGE_NATIVE_CONSTANTS} from '../../../../constants/package.native.constants';

export default class PackageController {

	constructor($state, $stateParams, $scope, JFrogTableViewOptions,
	            JFrogUIUtils, JFrogEventBus, $rootScope, JFrogModal) {
		this.$state = $state;
		this.$scope = $scope;
		this.$stateParams = $stateParams;
		this.JFrogTableViewOptions = JFrogTableViewOptions;
		this.jFrogUIUtils = JFrogUIUtils;
		this.JFrogEventBus = JFrogEventBus;
		this.$rootScope = $rootScope;
		this.modal = JFrogModal;
		this.PACKAGE_NATIVE_CONSTANTS = PACKAGE_NATIVE_CONSTANTS;
	}

	$onInit() {
		this.initConstants();
		if (this.isWithXray && typeof this.isWithXray === 'function') {
			this.isWithXray().then((response) => {
				this.withXray = response;
				this.initTable();
			});
		} else {
			this.initTable();
		}
		this.summaryColumns = this.getSummaryColumns();
	}

	initConstants() {
		this.packageAlias = this.jFrogUIUtils.capitalizeFirstLetter(
			this.PACKAGE_NATIVE_CONSTANTS[this.packageType].package.alias
		);
		this.versionAlias = this.jFrogUIUtils.capitalizeFirstLetter(
			this.PACKAGE_NATIVE_CONSTANTS[this.packageType].version.alias
		);
		this.packageTypeIcon = this.PACKAGE_NATIVE_CONSTANTS[this.packageType].package.icon;
		this.packagesIcon = this.PACKAGE_NATIVE_CONSTANTS[this.packageType].packages.icon;
	}

	initTable() {
		this.tableViewOptions = new this.JFrogTableViewOptions(this.$scope);
		this.columns = this.getTableColumns();
		this.tableViewOptions
		    .setColumns(this.columns)
		    .setRowsPerPage(20)
		    .setEmptyTableText(`No ${this.versionAlias}s`)
		    .setActions(this.getActions())
		    .setData(this.package.versions);
		this.tableViewOptions.on('row.clicked', this.onRowClick.bind(this));
		this.tableViewOptions.useExternalSortCallback(this.onSortChange.bind(this));

	}

	onSortChange(field, dir) {
		if (field === 'repo') field = 'repoKey';

		this.refreshPackage({daoParams: {
			packageType: this.packageType,
			package: this.package.name,
			sortBy: field,
			order: dir
		}}).then(() => {
			this.tableViewOptions.setData(this.package.versions);
		})
	}

	onRowClick(row) {
		if (row && row.entity && row.entity.name && !$(row.event.target).is('.copy-to-clip')) {
			this.goToVersion(row.entity.name, row.entity.repo);
		}
	}

	getActions() {
		// TODO: Export this to a constants json with all actions relevant to a repo type (and bind to ctrl)
		return [{
			icon: 'icon icon-show-in-tree',
			tooltip: 'Show In Tree',
			visibleWhen: () => this.showInTree && typeof this.showInTree === 'function',
			callback: (row) => {
				let pathParams = {
					repo: row.repo,
					package: this.package.name,
					version: row.name
				};
				this.showInTree({pathParams: pathParams});
			}
		}, {
			icon: 'icon icon-report',
			tooltip: 'View manifest',
			callback: (row) => {
				this.showManifest(row.name, row.repo);
			}
		}];
	}

	getTableColumns() {
		return [{
			field: 'name',
			header: `${this.versionAlias} Name`,
			width: '20%',
			cellTemplate: require('./cellTemplates/name.cell.template.html')
		}, {
			field: 'repo',
			header: 'Repository',
			width: '20%'
		}, {
			field: 'packageId',
			header: `${this.packageAlias} ID`,
			cellTemplate: require('./cellTemplates/package.id.cell.template.html'),
			width: '20%'
		}, {
			field: 'lastModified',
			header: 'Last Modified',
			cellTemplate: `<div class="last-modified">
                                {{ row.entity.lastModified | date : 'medium'}}
                            </div>`,
			width: '25%'
		}, {
			field: 'size',
			header: 'Size',
			cellTemplate: `<div class="size">
								{{ row.entity.size.length ? row.entity.size : (row.entity.size | filesize)}}
                           </div>`,
			width: '15%'
		}, {
			field: 'downloadsCount',
			header: 'Downloads',
			sortable: false,
			width: '20%',
			cellTemplate: require('./cellTemplates/download.count.cell.template.html'),
		},
			// TODO: Xray is for phase 2 $ctrl.withXray
			/*{
			field: 'xray',
			header: 'Xray',
			cellTemplate: `<div class="xray">
								{{row.entity.xray}}
							</div>`,
			width: '20%'
		}*/];
	}

	goToVersion(versionName, repo) {
		this.JFrogEventBus.dispatch(this.JFrogEventBus.getEventsDefinition().NATIVE_PACKAGES_ENTER, {
			packageType: this.packageType,
			package: this.package.name,
			repo: repo,
			version: versionName
		});
	}

	goBack() {
		this.JFrogEventBus.dispatch(this.JFrogEventBus.getEventsDefinition().NATIVE_PACKAGES_ENTER, {
			packageType: this.packageType
		});
	}

	showManifest(versionName, repo) {
		if (this.getManifest && typeof this.getManifest === 'function') {
			let daoParams = {
				packageType: this.packageType,
				package: this.package.name,
				version: versionName,
				repo: repo,
				manifest: true
			};

			this.getManifest({daoParams: daoParams}).then((response) => {
				this.modalScope = this.$rootScope.$new();
				this.modalScope.modalTitle = 'Manifest.json';

				this.modalScope.closeModal = () => {
					return this.modalInstance.close();
				};
				this.modalScope.downloadManifest = () => {
					this.jFrogUIUtils.saveTextAsFile(this.modalScope.manifest,
						`manifest_${this.package.name}_${versionName}.txt`);
					this.modalScope.closeModal();
				};
				this.modalScope.manifest = JSON.stringify(angular.fromJson(response.fileContent), null, '\t');
				this.modalInstance = this.modal.launchModal('manifest.modal', this.modalScope, 'lg');
			});
		}
	}

	getSummaryColumns() {
		return [{
			class: 'package-icon',
			template: `<div class="summary-icon-column">
							<i class="icon" ng-class="$ctrl.packagesIcon"></i>
						</div>`,
			isActive: true,
			noWrap: true,
			width: '120px'
		}, {
			label: `${this.packageAlias} Name`,
			class: 'package-name',
			noWrap: true,
			template: `<span jf-tooltip-on-overflow>{{$ctrl.package.name || 'No package'}}</span>`,
			isActive: true
		}, {
			label: 'Number Of Downloads',
			class: 'package-downloads-count',
			template: `{{$ctrl.package.downloadsCount}}`,
			isActive: true
		}, {
			label: 'Last Modified',
			class: 'package-modified-date',
			template: `<span jf-tooltip-on-overflow>
                        {{$ctrl.package.lastModified ? ($ctrl.package.lastModified | date : 'medium') : '--'}}
                       </span>`,
			noWrap: true,
			isActive: true
		}];
	}

	calcVersionDownloads(e, row) {
		e.stopPropagation();
		if (!this.getVersionDownloadsCount || !typeof this.getVersionDownloadsCount === 'function') {
			return;
		}

		let daoParams = {
			repo: row.repo,
			package: this.package.name,
			packageType: this.packageType,
			version: row.name,
		};
		this.getVersionDownloadsCount({daoParams: daoParams}).then((response) => {
			row.downloadsCount = response.totalDownloads;
			row.calculated = true;
		});
	}
}