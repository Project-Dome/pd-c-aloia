/**
 * @NApiVersion     2.1
 * @NScriptType     ClientScript
 * @NModuleScope    SameAccount
 * @author          Project Dome - Rogério Gonçalves Rodrigues
 */


define(['N/ui/message', 'N/runtime'], function (message, runtime) {

    let _originalLineValues = {};

 
    function isAdmin() {
        let _roleId = runtime.getCurrentUser().role;
        return _roleId === 3;
    }


    function lineInit(context) {
        if (context.sublistId !== 'item') {
            return;
        }

        // if (isAdmin()) {
        //     return;
        // }

        let _currentRecord = context.currentRecord;

        _originalLineValues = {
            item: _currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' }),
            quantity: _currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' }),
            rate: _currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'rate' }),
            amount: _currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'amount' }),
            custcol_aae_purchaseorder: _currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_aae_purchaseorder' })
        };
    }


    function fieldChanged(context) {
        if (context.sublistId !== 'item') {
            return;
        }

        // if (isAdmin()) {
        //     return;
        // }

        let _currentRecord = context.currentRecord;

        let _poValue = _currentRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_aae_purchaseorder'
        });

        if (_poValue) {
            let _blockedFields = ['item', 'quantity', 'rate', 'amount', 'custcol_aae_purchaseorder'];

            if (_blockedFields.indexOf(context.fieldId) !== -1) {
                let _originalValue = _originalLineValues[context.fieldId];

                _currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: context.fieldId,
                    value: _originalValue,
                    ignoreFieldChange: true
                });

                message.create({
                    title: "Warning",
                    message: "This line is linked to a Purchase Order and cannot be edited.",
                    type: message.Type.WARNING
                }).show();

                alert('This field cannot be changed because the line is linked to a Purchase Order.');
            }
        }
    }


    function validateField(context) {
        if (context.sublistId !== 'item') {
            return true;
        }

        // if (isAdmin()) {
        //     return true;
        // }

        let _currentRecord = context.currentRecord;

        let _poValue = _currentRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_aae_purchaseorder'
        });

        if (_poValue && context.fieldId === 'custcol_aae_purchaseorder') {
            alert('This field cannot be modified because it is already linked to a Purchase Order.');
            return false;
        }

        return true;
    }


    function validateDelete(context) {
        if (context.sublistId !== 'item') {
            return true;
        }

        // if (isAdmin()) {
        //     return true;
        // }

        let _currentRecord = context.currentRecord;

        let _poValue = _currentRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_aae_purchaseorder'
        });

        if (_poValue) {
            alert('You cannot delete a line that is linked to a Purchase Order.');
            return false;
        }

        return true;
    }

    return {
        lineInit: lineInit,
        fieldChanged: fieldChanged,
        validateField: validateField,
        validateDelete: validateDelete
    };
});
