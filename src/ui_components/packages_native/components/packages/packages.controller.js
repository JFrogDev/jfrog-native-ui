import {PACKAGE_NATIVE_CONSTANTS} from '../../../../constants/package.native.constants';

export default class PackagesController {

	constructor($state, $stateParams, $scope, JFrogTableViewOptions, JfFullTextService, JFrogUIUtils, JFrogEventBus
		, $location) {
		this.$state = $state;
		this.$scope = $scope;
		this.$stateParams = $stateParams;
		this.JFrogTableViewOptions = JFrogTableViewOptions;
		this.fullTextService = JfFullTextService;
		this.jFrogUIUtils = JFrogUIUtils;
		this.JFrogEventBus = JFrogEventBus;
		this.PACKAGE_NATIVE_CONSTANTS = PACKAGE_NATIVE_CONSTANTS;
		this.$location = $location;
	}

	$onInit() {
		this.refreshAll();
	}

	refreshAll() {
		this.initFilters();
		this.initConstants();
		this.initTable();
	}

	initConstants() {
		this.packageAlias = this.jFrogUIUtils.capitalizeFirstLetter(
			this.PACKAGE_NATIVE_CONSTANTS[this.selectedPackageType.text].package.alias);
		this.versionAlias = this.jFrogUIUtils.capitalizeFirstLetter(
			this.PACKAGE_NATIVE_CONSTANTS[this.selectedPackageType.text].version.alias);
		this.packageTypeIcon = this.PACKAGE_NATIVE_CONSTANTS[this.selectedPackageType.text].package.icon;
		this.versionIcon = this.PACKAGE_NATIVE_CONSTANTS[this.selectedPackageType.text].version.icon;
	}

	initFilters() {
		this.selectedPackageType = _.find(this.packageTypes, (packageType) => {
			return packageType.text === this.$stateParams.packageType;
		});

		let savedFilters = this.getSavedFiltersFromUrl();
		this.reposList = _.map(this.filters.repos, (value) => {
			return {
				text: value,
				isSelected: !!savedFilters.repos[value]
			};
		});

		this.moreFiltersList = _.map(this.filters.extraFilters, (value) => {
			return {
				text: value,
				isSelected: !!savedFilters.otherFilters[value],
				inputTextValue: savedFilters.otherFilters[value] || ''
			};
		});
	}

	initTable() {
		this.tableViewOptions = new this.JFrogTableViewOptions(this.$scope);
		this.tableViewOptions
		    .setColumns(this.getColumns())
		    .showFilter(false)
		    .showCounter(false)
		    .showHeaders(false)
		    .showPagination(false)
		    .setPaginationMode(this.tableViewOptions.VIRTUAL_SCROLL)
		    .setRowsPerPage(20)
		    .setRowHeight(66)
		    .setEmptyTableText(`No ${this.packageAlias}s`)
		    .setData(this.packages.list.data);

		this.tableViewOptions.on('row.clicked', this.onRowClick.bind(this));
	}

	onRowClick(row) {
		if (row && row.entity && row.entity.name && row.entity.name !== 'Name') {
			this.goToPackage(row.entity.name);
		}
	}

	showAllRepos(e, text) {
		e.stopPropagation();
		this.fullTextService.showFullTextModal(text, 'Repositories', 590);
	}

	getColumns() {
		return [{
			field: 'name',
			header: 'Name',
			width: '20%',
			cellTemplate: `<div class="name">
                                {{row.entity.name}}
                            </div>`
		}, {
			field: 'repositories',
			header: 'Repositories',
			cellTemplate: require('./cellTemplates/repositories.cell.template.html'),
			width: '25%'
		}, {
			field: 'downloadsCount',
			header: 'Download Count',
			cellTemplate: require('./cellTemplates/download.count.cell.template.html'),
			width: '15%'
		}, {
			field: 'versionsCount',
			header: 'Versions Count',
			cellTemplate: require('./cellTemplates/versions.count.cell.template.html'),
			width: '10%'
		}, {
			field: 'description',
			header: 'Description',
			cellTemplate: `<div class="description">
                                {{row.entity.description}}
                            </div>`,
			width: '30%'
		}];
	}

	getSelectedRepos() {
		let selected = _.filter(this.reposList, (repo) => {
			return repo.isSelected;
		});
		if (selected.length) {
			this.selectedRepos = [{
				id: 'repo',
				comparator: this.PACKAGE_NATIVE_CONSTANTS.defaultComparator,
				values: selected.map((selectedRepo) => {
					return selectedRepo.text;
				})
			}];
		} else {
			this.selectedRepos = null;
		}
	}

	getSelectedFilters() {
		let selected = _.filter(this.moreFiltersList, (filter) => {
			return filter.isSelected;
		}).map((filter) => {
			return {
				id: this.PACKAGE_NATIVE_CONSTANTS[this.selectedPackageType.text].filters[filter.text],
				comparator: this.PACKAGE_NATIVE_CONSTANTS.defaultComparator,
				values: [filter.inputTextValue || '']
			};
		});
		this.selectedFilters = selected.length ? selected : null;
	}

	getFilteredData() {
		this.getSelectedFilters();
		if (this.refreshPackages && typeof this.refreshPackages === 'function') {
			let daoParams = {
				filters: this.concatAllActiveFilters(),
				packageType: this.selectedPackageType.text
			};
			//daoParams.f = this.encodeJSONToBase64String(daoParams.filters);
			//this.saveFiltersInURL(daoParams.f);

			this.refreshPackages({daoParams: daoParams}).then(() => {
				this.tableViewOptions.setData(this.packages.list.data);
			});
		}
	}

	concatAllActiveFilters() {
		let filters = [];
		filters = (this.selectedFilters ? filters.concat(this.selectedFilters) : filters);
		filters = (this.selectedRepos ? filters.concat(this.selectedRepos) : filters);
		return filters;
	}

	isAnyRepoSelected() {
		return this.selectedRepos &&
			this.selectedRepos.length;
	}

	isExtraFilterSelected() {
		return this.selectedFilters &&
			this.selectedFilters.length;
	}

	isValidFilterForm() {
		//return ( this.isAnyRepoSelected() && !this.isExtraFilterSelected()) ||
		//	(this.isExtraFilterSelected());
		return true;
	}

	onPackageTypeChange() {
		// Fire a refresh callback for getting packages and filters
		this.refreshAll();
	}

	onRepoFilterChange() {
		this.getSelectedRepos();
	}

	onExtraFilterChange() {
		this.getSelectedFilters();
	}

	getPackageTypeTemplate($item) {
		return `<div>
                    <i class="icon ${$item.iconClass}"></i>
                    <span>${$item.text}</span>
                </div>`;
	}

	goToPackage(packageName) {
		this.JFrogEventBus.dispatch(this.JFrogEventBus.getEventsDefinition().NATIVE_PACKAGES_ENTER,
			{packageType: this.selectedPackageType.text, package: packageName});
	}

	encodeJSONToBase64String(jsonObject) {
		let jsonSting = JSON.stringify(jsonObject);
		return btoa(jsonSting);
	}

	decodeJSONFromBase64String(encodedJsonSting) {
		if (!encodedJsonSting) {
			return [];
		}
		let jsonString = atob(encodedJsonSting);
		return JSON.parse(jsonString);
	}

	getSavedFiltersFromJson(savedFiltersJson) {
		let repos = [];
		let otherFilters = [];
		let selectedRepoTypeFilters = this.PACKAGE_NATIVE_CONSTANTS[this.selectedPackageType.text].filters;
		_.forEach(savedFiltersJson, (savedFilter) => {
			if (savedFilter.id === 'repo') {
				repos = savedFilter.values;
			} else {
				let savedFilterName = _.findKey(selectedRepoTypeFilters, (v) => {
					return v === savedFilter.id;
				});
				otherFilters[savedFilterName] = savedFilter.values[0];
			}
		});
		return {repos: repos, otherFilters: otherFilters};
	}

	saveFiltersInURL(base64String) {
		this.$location.search({f: base64String});
	}

	getSavedFiltersFromUrl() {
		return this.getSavedFiltersFromJson(this.decodeJSONFromBase64String(this.$stateParams.f))
	}

}