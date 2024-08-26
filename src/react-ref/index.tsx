import React from 'react';
// import ResizableScrollableTabs from "./caseParentRefNOwnRef/base";
// import ResizableScrollableTabs from "./caseParentRefNOwnRef/caseUseImperativeHandle";
// import ResizableScrollableTabs from './caseParentRefNOwnRef/caseCallbackRef';
import TestDetectDomNodeChange from './detectDomNodeChange';
import './styles.css';

const TestReactRef = () => {
    return (
        <div className="App">
            <TestDetectDomNodeChange />
        </div>
    );
};

export default TestReactRef;
