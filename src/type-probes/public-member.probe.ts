// POSITIVE CONTROL — must compile clean.
//
// Without this, the negative probe would pass just as well against a broken
// import, a bad path, or a type that refused EVERYTHING — none of which would
// say anything about private members.
import { LangsysApp } from '../index.js';

LangsysApp.setWriteGrant;
LangsysApp.getCountries;
LangsysApp.init;
LangsysApp.refresh;
LangsysApp.detectPreferredLocale;
