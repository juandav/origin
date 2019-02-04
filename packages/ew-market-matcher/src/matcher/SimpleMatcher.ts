// Copyright 2018 Energy Web Foundation
// This file is part of the Origin Application brought to you by the Energy Web Foundation,
// a global non-profit organization focused on accelerating blockchain technology across the energy sector, 
// incorporated in Zug, Switzerland.
//
// The Origin Application is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// This is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY and without an implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details, at <http://www.gnu.org/licenses/>.
//
// @authors: slock.it GmbH, Heiko Burkhardt, heiko.burkhardt@slock.it

import { Matcher } from './Matcher';
import { Controller } from '../controller/Controller';
import * as EwOrigin from 'ew-origin-lib';
import * as EwMarket from 'ew-market-lib';
import * as EwGeneral from 'ew-utils-general-lib';

export class SimpleMatcher extends Matcher {

    static SLEEP(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private controller: Controller;
    
    constructor() {
        super();
    }

    setController(controller: Controller) {
        this.controller = controller;
    }

    match(certificate: EwOrigin.Certificate.Entity, agreements: EwMarket.Agreement.Entity[]) {
        throw new Error('Method not implemented.');
    }

}