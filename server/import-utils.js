"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importFromCSV = importFromCSV;
var sync_1 = require("csv-parse/sync");
/**
 * Process CSV data and import it into the database
 * @param entityType The type of entity to import
 * @param csvData The CSV data as a string
 * @param storage The storage interface
 */
function importFromCSV(entityType, csvData, storage) {
    return __awaiter(this, void 0, void 0, function () {
        var records, results, _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    records = (0, sync_1.parse)(csvData, {
                        columns: true,
                        skip_empty_lines: true,
                        trim: true,
                    });
                    if (records.length === 0) {
                        return [2 /*return*/, { success: false, message: "No records found in the CSV file" }];
                    }
                    results = {
                        success: true,
                        created: 0,
                        updated: 0,
                        failed: 0,
                        errors: [],
                    };
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 22, , 23]);
                    _a = entityType;
                    switch (_a) {
                        case 'categories': return [3 /*break*/, 2];
                        case 'customers': return [3 /*break*/, 4];
                        case 'items': return [3 /*break*/, 6];
                        case 'customerProducts': return [3 /*break*/, 8];
                        case 'sections': return [3 /*break*/, 10];
                        case 'machines': return [3 /*break*/, 12];
                        case 'masterBatches': return [3 /*break*/, 14];
                        case 'rawMaterials': return [3 /*break*/, 16];
                        case 'users': return [3 /*break*/, 18];
                    }
                    return [3 /*break*/, 20];
                case 2: return [4 /*yield*/, importCategories(records, storage, results)];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 21];
                case 4: return [4 /*yield*/, importCustomers(records, storage, results)];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 21];
                case 6: return [4 /*yield*/, importItems(records, storage, results)];
                case 7:
                    _b.sent();
                    return [3 /*break*/, 21];
                case 8: return [4 /*yield*/, importCustomerProducts(records, storage, results)];
                case 9:
                    _b.sent();
                    return [3 /*break*/, 21];
                case 10: return [4 /*yield*/, importSections(records, storage, results)];
                case 11:
                    _b.sent();
                    return [3 /*break*/, 21];
                case 12: return [4 /*yield*/, importMachines(records, storage, results)];
                case 13:
                    _b.sent();
                    return [3 /*break*/, 21];
                case 14: return [4 /*yield*/, importMasterBatches(records, storage, results)];
                case 15:
                    _b.sent();
                    return [3 /*break*/, 21];
                case 16: return [4 /*yield*/, importRawMaterials(records, storage, results)];
                case 17:
                    _b.sent();
                    return [3 /*break*/, 21];
                case 18: return [4 /*yield*/, importUsers(records, storage, results)];
                case 19:
                    _b.sent();
                    return [3 /*break*/, 21];
                case 20: return [2 /*return*/, { success: false, message: "Unsupported entity type: ".concat(entityType) }];
                case 21: return [2 /*return*/, results];
                case 22:
                    error_1 = _b.sent();
                    return [2 /*return*/, {
                            success: false,
                            message: "Error processing ".concat(entityType, ": ").concat(error_1.message),
                            errors: results.errors
                        }];
                case 23: return [2 /*return*/];
            }
        });
    });
}
// Helper function to safely process each record
function safeProcess(record, process, results) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, process()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_2 = _a.sent();
                    results.failed++;
                    results.errors.push("Error processing record ".concat(JSON.stringify(record), ": ").concat(error_2.message));
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Import categories
function importCategories(records, storage, results) {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_1, _i, records_1, record;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_1 = function (record) {
                        var existingCategory;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, storage.getCategory(record.id)];
                                case 1:
                                    existingCategory = _b.sent();
                                    if (!existingCategory) return [3 /*break*/, 3];
                                    // Update existing category
                                    return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                            var updated;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, storage.updateCategory(record.id, {
                                                            name: record.name,
                                                            code: record.code,
                                                        })];
                                                    case 1:
                                                        updated = _a.sent();
                                                        if (updated)
                                                            results.updated++;
                                                        return [2 /*return*/, updated];
                                                }
                                            });
                                        }); }, results)];
                                case 2:
                                    // Update existing category
                                    _b.sent();
                                    return [3 /*break*/, 5];
                                case 3: 
                                // Create new category
                                return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                        var created;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, storage.createCategory({
                                                        id: record.id,
                                                        name: record.name,
                                                        code: record.code,
                                                    })];
                                                case 1:
                                                    created = _a.sent();
                                                    results.created++;
                                                    return [2 /*return*/, created];
                                            }
                                        });
                                    }); }, results)];
                                case 4:
                                    // Create new category
                                    _b.sent();
                                    _b.label = 5;
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, records_1 = records;
                    _a.label = 1;
                case 1:
                    if (!(_i < records_1.length)) return [3 /*break*/, 4];
                    record = records_1[_i];
                    return [5 /*yield**/, _loop_1(record)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Import customers
function importCustomers(records, storage, results) {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_2, _i, records_2, record;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_2 = function (record) {
                        var existingCustomer;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, storage.getCustomer(record.id)];
                                case 1:
                                    existingCustomer = _b.sent();
                                    if (!existingCustomer) return [3 /*break*/, 3];
                                    // Update existing customer
                                    return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                            var updated;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, storage.updateCustomer(record.id, {
                                                            code: record.code,
                                                            name: record.name,
                                                            nameAr: record.nameAr || "",
                                                            userId: record.userId || null,
                                                            plateDrawerCode: record.plateDrawerCode || null,
                                                        })];
                                                    case 1:
                                                        updated = _a.sent();
                                                        if (updated)
                                                            results.updated++;
                                                        return [2 /*return*/, updated];
                                                }
                                            });
                                        }); }, results)];
                                case 2:
                                    // Update existing customer
                                    _b.sent();
                                    return [3 /*break*/, 5];
                                case 3: 
                                // Create new customer
                                return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                        var created;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, storage.createCustomer({
                                                        id: record.id,
                                                        code: record.code,
                                                        name: record.name,
                                                        nameAr: record.nameAr || "",
                                                        userId: record.userId || null,
                                                        plateDrawerCode: record.plateDrawerCode || null,
                                                    })];
                                                case 1:
                                                    created = _a.sent();
                                                    results.created++;
                                                    return [2 /*return*/, created];
                                            }
                                        });
                                    }); }, results)];
                                case 4:
                                    // Create new customer
                                    _b.sent();
                                    _b.label = 5;
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, records_2 = records;
                    _a.label = 1;
                case 1:
                    if (!(_i < records_2.length)) return [3 /*break*/, 4];
                    record = records_2[_i];
                    return [5 /*yield**/, _loop_2(record)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Import items
function importItems(records, storage, results) {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_3, _i, records_3, record;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_3 = function (record) {
                        var existingItem;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, storage.getItem(record.id)];
                                case 1:
                                    existingItem = _b.sent();
                                    if (!existingItem) return [3 /*break*/, 3];
                                    // Update existing item
                                    return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                            var updated;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, storage.updateItem(record.id, {
                                                            categoryId: record.categoryId,
                                                            name: record.name,
                                                            fullName: record.fullName,
                                                        })];
                                                    case 1:
                                                        updated = _a.sent();
                                                        if (updated)
                                                            results.updated++;
                                                        return [2 /*return*/, updated];
                                                }
                                            });
                                        }); }, results)];
                                case 2:
                                    // Update existing item
                                    _b.sent();
                                    return [3 /*break*/, 5];
                                case 3: 
                                // Create new item
                                return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                        var created;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, storage.createItem({
                                                        id: record.id,
                                                        categoryId: record.categoryId,
                                                        name: record.name,
                                                        fullName: record.fullName,
                                                    })];
                                                case 1:
                                                    created = _a.sent();
                                                    results.created++;
                                                    return [2 /*return*/, created];
                                            }
                                        });
                                    }); }, results)];
                                case 4:
                                    // Create new item
                                    _b.sent();
                                    _b.label = 5;
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, records_3 = records;
                    _a.label = 1;
                case 1:
                    if (!(_i < records_3.length)) return [3 /*break*/, 4];
                    record = records_3[_i];
                    return [5 /*yield**/, _loop_3(record)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Import customer products
function importCustomerProducts(records, storage, results) {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_4, _i, records_4, record;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_4 = function (record) {
                        var existingProducts, existingProduct;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, storage.getCustomerProducts()];
                                case 1:
                                    existingProducts = _b.sent();
                                    existingProduct = existingProducts.find(function (p) {
                                        return p.customerId === record.customerId && p.itemId === record.itemId;
                                    });
                                    if (!existingProduct) return [3 /*break*/, 3];
                                    // Update existing customer product
                                    return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                            var updated;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, storage.updateCustomerProduct(existingProduct.id, {
                                                            customerId: record.customerId,
                                                            categoryId: record.categoryId,
                                                            itemId: record.itemId,
                                                            sizeCaption: record.sizeCaption,
                                                            width: parseFloat(record.width),
                                                            leftF: parseFloat(record.leftF),
                                                            rightF: parseFloat(record.rightF),
                                                            thickness: parseFloat(record.thickness),
                                                            thicknessOne: parseFloat(record.thicknessOne),
                                                            printingCylinder: parseFloat(record.printingCylinder) || 0,
                                                            lengthCm: parseFloat(record.lengthCm) || 0,
                                                            cuttingLength: parseFloat(record.cuttingLength) || 0,
                                                            rawMaterial: record.rawMaterial,
                                                            masterBatchId: record.masterBatchId,
                                                            printed: record.printed,
                                                            cuttingUnit: record.cuttingUnit,
                                                            unitWeight: parseFloat(record.unitWeight),
                                                            packing: record.packing,
                                                            punching: record.punching,
                                                            cover: record.cover,
                                                            volum: record.volum || null,
                                                            knife: record.knife || null,
                                                            notes: record.notes || null,
                                                        })];
                                                    case 1:
                                                        updated = _a.sent();
                                                        if (updated)
                                                            results.updated++;
                                                        return [2 /*return*/, updated];
                                                }
                                            });
                                        }); }, results)];
                                case 2:
                                    // Update existing customer product
                                    _b.sent();
                                    return [3 /*break*/, 5];
                                case 3: 
                                // Create new customer product
                                return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                        var created;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, storage.createCustomerProduct({
                                                        customerId: record.customerId,
                                                        categoryId: record.categoryId,
                                                        itemId: record.itemId,
                                                        sizeCaption: record.sizeCaption,
                                                        width: parseFloat(record.width),
                                                        leftF: parseFloat(record.leftF),
                                                        rightF: parseFloat(record.rightF),
                                                        thickness: parseFloat(record.thickness),
                                                        thicknessOne: parseFloat(record.thicknessOne),
                                                        printingCylinder: parseFloat(record.printingCylinder) || 0,
                                                        lengthCm: parseFloat(record.lengthCm) || 0,
                                                        cuttingLength: parseFloat(record.cuttingLength) || 0,
                                                        rawMaterial: record.rawMaterial,
                                                        masterBatchId: record.masterBatchId,
                                                        printed: record.printed,
                                                        cuttingUnit: record.cuttingUnit,
                                                        unitWeight: parseFloat(record.unitWeight),
                                                        packing: record.packing,
                                                        punching: record.punching,
                                                        cover: record.cover,
                                                        volum: record.volum || null,
                                                        knife: record.knife || null,
                                                        notes: record.notes || null,
                                                    })];
                                                case 1:
                                                    created = _a.sent();
                                                    results.created++;
                                                    return [2 /*return*/, created];
                                            }
                                        });
                                    }); }, results)];
                                case 4:
                                    // Create new customer product
                                    _b.sent();
                                    _b.label = 5;
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, records_4 = records;
                    _a.label = 1;
                case 1:
                    if (!(_i < records_4.length)) return [3 /*break*/, 4];
                    record = records_4[_i];
                    return [5 /*yield**/, _loop_4(record)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Import sections
function importSections(records, storage, results) {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_5, _i, records_5, record;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_5 = function (record) {
                        var existingSection;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, storage.getSection(record.id)];
                                case 1:
                                    existingSection = _b.sent();
                                    if (!existingSection) return [3 /*break*/, 3];
                                    // Update existing section
                                    return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                            var updated;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, storage.updateSection(record.id, {
                                                            name: record.name,
                                                        })];
                                                    case 1:
                                                        updated = _a.sent();
                                                        if (updated)
                                                            results.updated++;
                                                        return [2 /*return*/, updated];
                                                }
                                            });
                                        }); }, results)];
                                case 2:
                                    // Update existing section
                                    _b.sent();
                                    return [3 /*break*/, 5];
                                case 3: 
                                // Create new section
                                return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                        var created;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, storage.createSection({
                                                        id: record.id,
                                                        name: record.name,
                                                    })];
                                                case 1:
                                                    created = _a.sent();
                                                    results.created++;
                                                    return [2 /*return*/, created];
                                            }
                                        });
                                    }); }, results)];
                                case 4:
                                    // Create new section
                                    _b.sent();
                                    _b.label = 5;
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, records_5 = records;
                    _a.label = 1;
                case 1:
                    if (!(_i < records_5.length)) return [3 /*break*/, 4];
                    record = records_5[_i];
                    return [5 /*yield**/, _loop_5(record)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Import machines
function importMachines(records, storage, results) {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_6, _i, records_6, record;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_6 = function (record) {
                        var existingMachine;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, storage.getMachine(record.id)];
                                case 1:
                                    existingMachine = _b.sent();
                                    if (!existingMachine) return [3 /*break*/, 3];
                                    // Update existing machine
                                    return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                            var updated;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, storage.updateMachine(record.id, {
                                                            name: record.name,
                                                            sectionId: record.sectionId,
                                                            isActive: record.isActive === 'true',
                                                        })];
                                                    case 1:
                                                        updated = _a.sent();
                                                        if (updated)
                                                            results.updated++;
                                                        return [2 /*return*/, updated];
                                                }
                                            });
                                        }); }, results)];
                                case 2:
                                    // Update existing machine
                                    _b.sent();
                                    return [3 /*break*/, 5];
                                case 3: 
                                // Create new machine
                                return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                        var created;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, storage.createMachine({
                                                        id: record.id,
                                                        name: record.name,
                                                        sectionId: record.sectionId,
                                                        isActive: record.isActive === 'true',
                                                    })];
                                                case 1:
                                                    created = _a.sent();
                                                    results.created++;
                                                    return [2 /*return*/, created];
                                            }
                                        });
                                    }); }, results)];
                                case 4:
                                    // Create new machine
                                    _b.sent();
                                    _b.label = 5;
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, records_6 = records;
                    _a.label = 1;
                case 1:
                    if (!(_i < records_6.length)) return [3 /*break*/, 4];
                    record = records_6[_i];
                    return [5 /*yield**/, _loop_6(record)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Import master batches
function importMasterBatches(records, storage, results) {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_7, _i, records_7, record;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_7 = function (record) {
                        var existingMasterBatch;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, storage.getMasterBatch(record.id)];
                                case 1:
                                    existingMasterBatch = _b.sent();
                                    if (!existingMasterBatch) return [3 /*break*/, 3];
                                    // Update existing master batch
                                    return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                            var updated;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, storage.updateMasterBatch(record.id, {
                                                            name: record.name,
                                                        })];
                                                    case 1:
                                                        updated = _a.sent();
                                                        if (updated)
                                                            results.updated++;
                                                        return [2 /*return*/, updated];
                                                }
                                            });
                                        }); }, results)];
                                case 2:
                                    // Update existing master batch
                                    _b.sent();
                                    return [3 /*break*/, 5];
                                case 3: 
                                // Create new master batch
                                return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                        var created;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, storage.createMasterBatch({
                                                        id: record.id,
                                                        name: record.name,
                                                    })];
                                                case 1:
                                                    created = _a.sent();
                                                    results.created++;
                                                    return [2 /*return*/, created];
                                            }
                                        });
                                    }); }, results)];
                                case 4:
                                    // Create new master batch
                                    _b.sent();
                                    _b.label = 5;
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, records_7 = records;
                    _a.label = 1;
                case 1:
                    if (!(_i < records_7.length)) return [3 /*break*/, 4];
                    record = records_7[_i];
                    return [5 /*yield**/, _loop_7(record)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Import raw materials
function importRawMaterials(records, storage, results) {
    return __awaiter(this, void 0, void 0, function () {
        var existingRawMaterials, _loop_8, _i, records_8, record;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.getRawMaterials()];
                case 1:
                    existingRawMaterials = _a.sent();
                    _loop_8 = function (record) {
                        var existingMaterial;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    existingMaterial = existingRawMaterials.find(function (m) {
                                        return m.name === record.name && m.type === record.type;
                                    });
                                    if (!existingMaterial) return [3 /*break*/, 2];
                                    // Update existing raw material
                                    return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                            var updated;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, storage.updateRawMaterial(existingMaterial.id, {
                                                            name: record.name,
                                                            type: record.type,
                                                            quantity: parseFloat(record.quantity),
                                                            unit: record.unit,
                                                        })];
                                                    case 1:
                                                        updated = _a.sent();
                                                        if (updated)
                                                            results.updated++;
                                                        return [2 /*return*/, updated];
                                                }
                                            });
                                        }); }, results)];
                                case 1:
                                    // Update existing raw material
                                    _b.sent();
                                    return [3 /*break*/, 4];
                                case 2: 
                                // Create new raw material
                                return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                        var created;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, storage.createRawMaterial({
                                                        name: record.name,
                                                        type: record.type,
                                                        quantity: parseFloat(record.quantity),
                                                        unit: record.unit,
                                                    })];
                                                case 1:
                                                    created = _a.sent();
                                                    results.created++;
                                                    return [2 /*return*/, created];
                                            }
                                        });
                                    }); }, results)];
                                case 3:
                                    // Create new raw material
                                    _b.sent();
                                    _b.label = 4;
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, records_8 = records;
                    _a.label = 2;
                case 2:
                    if (!(_i < records_8.length)) return [3 /*break*/, 5];
                    record = records_8[_i];
                    return [5 /*yield**/, _loop_8(record)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Import users
function importUsers(records, storage, results) {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_9, _i, records_9, record;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_9 = function (record) {
                        var existingUser;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, storage.getUserByUsername(record.username)];
                                case 1:
                                    existingUser = _b.sent();
                                    if (!existingUser) return [3 /*break*/, 3];
                                    // Update existing user
                                    return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                            var updated;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, storage.updateUser(existingUser.id, __assign(__assign({ username: record.username }, (record.password ? { password: record.password } : {})), { name: record.name, role: record.role, isActive: record.isActive === 'true', sectionId: record.sectionId || null }))];
                                                    case 1:
                                                        updated = _a.sent();
                                                        if (updated)
                                                            results.updated++;
                                                        return [2 /*return*/, updated];
                                                }
                                            });
                                        }); }, results)];
                                case 2:
                                    // Update existing user
                                    _b.sent();
                                    return [3 /*break*/, 5];
                                case 3: 
                                // Create new user
                                return [4 /*yield*/, safeProcess(record, function () { return __awaiter(_this, void 0, void 0, function () {
                                        var created;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, storage.createUser({
                                                        username: record.username,
                                                        password: record.password,
                                                        name: record.name,
                                                        role: record.role,
                                                        isActive: record.isActive === 'true',
                                                        sectionId: record.sectionId || null,
                                                    })];
                                                case 1:
                                                    created = _a.sent();
                                                    results.created++;
                                                    return [2 /*return*/, created];
                                            }
                                        });
                                    }); }, results)];
                                case 4:
                                    // Create new user
                                    _b.sent();
                                    _b.label = 5;
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, records_9 = records;
                    _a.label = 1;
                case 1:
                    if (!(_i < records_9.length)) return [3 /*break*/, 4];
                    record = records_9[_i];
                    return [5 /*yield**/, _loop_9(record)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
