'use strict';

const USER_ROLE_TYPE = {
	ANIMETA_ADMIN: 'ANIMETA_ADMIN',
	SUPER_ADMIN: 'SUPER_ADMIN',
	ADMIN:'ADMIN',
};

const USER_STATUS = {
	ACTIVE: 'ACTIVE',
	INACTIVE: 'INACTIVE',
	DELETED: 'DELETED'
};

const ADDRESS_STATUS = {
	'ACTIVE': 'ACTIVE',
	'DELETED': 'DELETED'
};

const TOKEN_TYPE = {
	JWT: 'JWT',
	OAUTH: "OAUTH"
};

const SESSION_STATUS = {
	ACTIVE: "ACTIVE",
	INACTIVE: "INACTIVE"
};

const COUNTRY_CODE = ["+93", "+355", "+213", "+1684", "+376", "+244", "+1264", "+672", "+1268", "+54", "+374", "+297", "+61", "+43", "+994", "+1242", "+973", "+880", "+1246", "+375", "+32", "+501", "+229", "+1441", "+975", "+591", "+387", "+267", "+55", "+246", "+673", "+359", "+226", "+257", "+855", "+237", "+1", "+238", "+345", "+236", "+235", "+56", "+86", "+61", "+61", "+57", "+269", "+242", "+243", "+682", "+506", "+225", "+385", "+53", "+357", "+420", "+45", "+253", "+1767", "+1849", "+593", "+20", "+503", "+240", "+291", "+372", "+251", "+500", "+298", "+679", "+358", "+33", "+594", "+689", "+241", "+220", "+995", "+49", "+233", "+350", "+30", "+299", "+1473", "+590", "+1671", "+502", "+44", "+224", "+245", "+595", "+509", "+379", "+504", "+852", "+36", "+354", "+91", "+62", "+98", "+964", "+353", "+44", "+972", "+39", "+1876", "+81", "+44", "+962", "+77", "+254", "+686", "+850", "+82", "+965", "+996", "+856", "+371", "+961", "+266", "+231", "+218", "+423", "+370", "+352", "+853", "+389", "+261", "+265", "+60", "+960", "+223", "+356", "+692", "+596", "+222", "+230", "+262", "+52", "+691", "+373", "+377", "+976", "+382", "+1664", "+212", "+258", "+95", "+264", "+674", "+977", "+31", "+599", "+687", "+64", "+505", "+227", "+234", "+683", "+672", "+1670", "+47", "+968", "+92", "+680", "+970", "+507", "+675", "+595", "+51", "+63", "+872", "+48", "+351", "+1939", "+974", "+40", "+7", "+250", "+262", "+590", "+290", "+1869", "+1758", "+590", "+508", "+1784", "+685", "+378", "+239", "+966", "+221", "+381", "+248", "+232", "+65", "+421", "+386", "+677", "+252", "+27", "+500", "+34", "+94", "+249", "+597", "+47", "+268", "+46", "+41", "+963", "+886", "+992", "+255", "+66", "+670", "+228", "+690", "+676", "+1868", "+216", "+90", "+993", "+1649", "+688", "+256", "+380", "+971", "+44", "+1", "+598", "+998", "+678", "+58", "+84", "+1284", "+1340", "+681", "+967", "+260", "+263", "+358"]



const ROLESPRIVILEGES = 

{
	"ANIMETA_ADMIN" : {
		currentAdmins: [""],
		dashboard: { allow: true },
		brands: { allow: true, create: true, view: true, edit: true, delete: true },
		campaigns: { allow: true, create: true, view: true, edit: true, delete: true },
		teams: {
			allow: true,
			admin: { create: true, view: true, edit: true, delete: true },
			brandManageer: { create: true, view: true, edit: true, delete: true },
			campaignManageer: { create: true, view: true, edit: true, delete: true }
		},
		creators: {
			allow: true, create: true, view: true, edit: false, delete: true,
			shortlist: { allow: true, create: true, view: true, edit: true, delete: true },
		},
		camapaignManagement: {
			allow: true
		},
		companyManagement: {
			allow:true
		}
	},
	"SUPER_ADMIN" : {
		dashboard: { allow: true },
		brands: { allow: true, create: true, view: true, edit: true, delete: true },
		campaigns: { allow: true, create: true, view: true, edit: true, delete: true },
		creators: {
			allow: true, create: false, view: true, edit: false, delete: false,
			shortlist: { allow: true, create: true, view: true, edit: true, delete: true },
		},
		teams: {
			allow: true,
			admin: { create: true, view: true, edit: true, delete: true },
			brandManageer: { create: true, view: true, edit: true, delete: true },
			campaignManageer: { create: true, view: true, edit: true, delete: true }
		},

		camapaignManagement: {
			allow: false
		},
		companyManagement: {
			allow:false
		}
	},
	"ADMIN" : {
		dashboard: { allow: true },
		brands: { allow: true, create: true, view: true, edit: true, delete: true },
		campaigns: { allow: true, create: true, view: true, edit: true, delete: true },
		creators: {
			allow: true, create: false, view: true, edit: false, delete: false,
			shortlist: { allow: true, create: true, view: true, edit: true, delete: true },
		},
		teams: {
			allow: true,
			admin: { create: true, view: true, edit: true, delete: true },
			brandManageer: { create: true, view: true, edit: true, delete: true },
			campaignManageer: { create: true, view: true, edit: true, delete: true }
		},

		camapaignManagement: {
			allow: false
		},
		companyManagement: {
			allow:false
		}
	}

}








module.exports = {
	USER_ROLE_TYPE,
	USER_STATUS,
	ADDRESS_STATUS,
	TOKEN_TYPE,
	SESSION_STATUS,
	COUNTRY_CODE,
	ROLESPRIVILEGES,

};