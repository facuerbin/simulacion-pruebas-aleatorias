#!/usr/bin/env node
"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
var yargs = require('yargs/yargs');
var hideBin = require('yargs/helpers').hideBin;
var argv = yargs(hideBin(process.argv)).argv;
var tables_1 = require("./modules/tables");
parseParams(argv);
function parseParams(params) {
    var randoms = parseNums(params.numeros);
    var alpha = parseAlpha(params.alpha);
    var intervals = Number(params.intervalos);
    var media = Number(params.media);
    switch (params.prueba.toLowerCase()) {
        case "chi":
            chiCuadrada(filterRandoms(randoms), intervals, alpha);
            break;
        case "kolmogorov":
            kolmogorov(filterRandoms(randoms), alpha);
            break;
        case "serial":
            serial(randoms, alpha);
            break;
        case "rachas":
            rachas(filterRandoms(randoms), media);
            break;
        case "poker":
            var probs = {
                dif: Number(params.distinto),
                couple: Number(params.pareja),
                three: Number(params.terna)
            };
            poker(randoms, probs, alpha);
            break;
        default:
            console.log("Por favor ingrese una prueba válida...");
    }
}
function chiCuadrada(randoms, intervals, alpha) {
    randoms = sortNums(randoms);
    var frecEsp = randoms.length / intervals;
    var gradLib = intervals - 1;
    var distribution = [];
    var _loop_1 = function (i) {
        distribution.push(randoms.filter(function (num) { return num < i / intervals && num >= (i - 1) / intervals; }));
    };
    for (var i = 1; i <= intervals; i++) {
        _loop_1(i);
    }
    console.log("------ Prueba de la Chi Cuadrada ------");
    console.log("------ Distribuciones ------");
    distribution.forEach(function (dist) {
        console.log(dist);
    });
    // (FO-FE)²/FE
    var estadisticoMuestral = distribution.map(function (dist) {
        return Math.pow((dist.length - frecEsp), 2) / frecEsp;
    }).reduce(function (acc, num) { return acc + num; });
    console.log("------ Estadístico Muestral = " + estadisticoMuestral);
    console.log("------ α = " + alpha);
    console.log("------ Grados de libertad = " + gradLib);
    console.log("------ Chi Cuadrada (" + alpha + ", " + gradLib + ") = " + tables_1.tables.chi[alpha][gradLib] + "\n");
    console.log("------ Resultado de la prueba ------");
    if (tables_1.tables.chi[alpha][gradLib] > estadisticoMuestral) {
        console.log(estadisticoMuestral + " < " + tables_1.tables.chi[alpha][gradLib] + " => S\u00CD CUMPLE LA PRUEBA");
        return true;
    }
    else {
        console.log(estadisticoMuestral + " < " + tables_1.tables.chi[alpha][gradLib] + " => NO CUMPLE LA PRUEBA");
        return false;
    }
}
function kolmogorov(randoms, alpha) {
    var n = randoms.length;
    var result = randoms.map(function (num, index) {
        return Math.abs((index + 1) / n - num);
    });
    var max = result.reduce(function (largest, num) { return largest < num ? num : largest; });
    console.log("------ Prueba de Kolmogorov-Smirnov ------");
    console.log("------ Números Aleatorios");
    randoms.forEach(function (num) {
        console.log(num);
    });
    console.log("------ abs(i/n - random)");
    result.forEach(function (num) {
        console.log(num);
    });
    console.log("------ Resultado de la prueba ------");
    if (max < tables_1.tables.kolmogorov[alpha][n]) {
        console.log("Kolmogorov (" + alpha + "," + n + ")=" + tables_1.tables.kolmogorov[alpha][n] + " > " + max + " => S\u00CD CUMPLE LA PRUEBA");
        return true;
    }
    else {
        console.log("Kolmogorov (" + alpha + "," + n + ")=" + tables_1.tables.kolmogorov[alpha][n] + " > " + max + " => NO CUMPLE LA PRUEBA");
        return false;
    }
}
function chi(distribution) {
    var frecEsp = distribution.reduce(function (acc, num) { return acc + num; }) / distribution.length;
    // (FO-FE)²/FE
    console.log(frecEsp);
    var chi = distribution.map(function (frecObs) {
        return Math.pow((frecObs - frecEsp), 2) / frecEsp;
    });
    var estadisticoMuestral = chi.reduce(function (acc, num) { return acc + num; });
    var result = chi.reduce(function (acc, num) { return acc + num; });
    return {
        frecEsp: frecEsp,
        frecObs: distribution,
        chi: chi,
        estadisticoMuestral: estadisticoMuestral
    };
}
function serial(randoms, alpha) {
    var resultsChi = chi(__spreadArray([], randoms));
    var randMatrix = parseMatrix(__spreadArray([], randoms));
    console.log("------ Prueba Serial ------");
    console.log("------ Distribuciones");
    randMatrix.matrix.forEach(function (row) {
        console.log(row);
    });
    console.log("------ Datos");
    console.log("Parejas: " + randMatrix.couples + "     Frec Esperada: " + randMatrix.expected + "\nN=" + randMatrix.total + " K=" + randMatrix.k);
    console.log("Estad\u00EDstico Muestral= " + resultsChi.estadisticoMuestral);
    console.log("------ Resultado ------");
    if (tables_1.tables.chi[alpha][randoms.length - 1] > resultsChi.estadisticoMuestral) {
        console.log("Chi(" + alpha + "," + (randoms.length - 1) + ") = " + tables_1.tables.chi[alpha][randoms.length - 1] + " > " + resultsChi.estadisticoMuestral + " => S\u00CD CUMPLE LA PRUEBA");
        return true;
    }
    else {
        console.log("Chi(" + alpha + "," + (randoms.length - 1) + ") = " + tables_1.tables.chi[alpha][randoms.length - 1] + " > " + resultsChi.estadisticoMuestral + " => NO CUMPLE LA PRUEBA");
        return false;
    }
}
function rachas(randoms, media) {
    var n = randoms.length;
    var nMenos = randoms.filter(function (num) { return num < 0.5; }).length;
    var nMas = n - nMenos;
    var arrayRachas = randoms.map(function (num) {
        return num < media ? "-" : "+";
    });
    var cantRachas = 1;
    arrayRachas.map(function (num, i) {
        if (arrayRachas[i + 1] && num != arrayRachas[i + 1]) {
            cantRachas++;
        }
    });
    var u = ((2 * nMenos * nMas) / n) + 0.5;
    var sigma = ((2 * nMenos * nMas) * ((2 * nMenos * nMas) - n)) / (Math.pow(n, 2) * (n - 1));
    var z0 = (cantRachas - u) / Math.sqrt(sigma);
    console.log(n, nMenos, randoms, sigma, arrayRachas, cantRachas, z0, u);
    console.log("rachas");
    return true;
}
function poker(frecObservadas, probs, alpha) {
    var cantidad = frecObservadas.length;
    // Calculo frecuencias esperadas
    var frecEsp = [
        cantidad * probs.dif,
        cantidad * probs.couple,
        cantidad * probs.three
    ];
    // Calculo chi cuadrada
    var chi = frecObservadas.map(function (frecObs, i) {
        return Math.pow((frecObs - frecEsp[i]), 2) / frecEsp[i];
    });
    var estadisticoMuestral = chi.reduce(function (acc, num) { return acc + num; });
    var resultTabla = tables_1.tables.chi[alpha][2];
    // Mostrar resultados
    console.log("------ Prueba de Poker ------");
    console.log("------ Distribuciones ------");
    frecObservadas.forEach(function (frec, i) {
        console.log(Object.keys(frecEsp)[i] + "FO --> " + frec + "     FE --> " + frecEsp[i]);
    });
    console.log("------ Resultado ------");
    if (resultTabla > estadisticoMuestral) {
        console.log(resultTabla + " > " + estadisticoMuestral + " => S\u00CD SE CUMPLE LA PRUEBA");
        return true;
    }
    else {
        console.log(resultTabla + " > " + estadisticoMuestral + " => NO SE CUMPLE LA PRUEBA");
        return false;
    }
}
function parseNums(nums) {
    // Convertimos el string a un array de strings
    var stringArray = nums.split(",");
    // Convertimos el array de strings en array de números
    var parsedNums = stringArray.map(function (num) { return Number(num); });
    return parsedNums;
}
function sortNums(nums) {
    return nums.sort(function (a, b) { return a - b; });
}
function parseMatrix(randoms) {
    var k = Math.sqrt(randoms.length);
    var couples = randoms.reduce(function (acc, num) { return acc + num; });
    var total = couples * 2;
    var matrix = [];
    var expected = couples / (Math.pow(k, 2));
    for (var i = 1; i <= k; i++) {
        matrix.push(randoms.splice(0, k));
    }
    return {
        matrix: matrix,
        total: total,
        couples: couples,
        k: k,
        expected: expected
    };
}
function filterRandoms(parsedNums) {
    // Retornamos los números entre (0;1)
    return parsedNums.filter(function (random) {
        if (random >= 0 && random < 1) {
            return random;
        }
    });
}
function parseAlpha(stringAlpha) {
    var alpha = Number(stringAlpha);
    if (alpha > 1 && alpha < 100) {
        alpha = alpha / 100;
    }
    return alpha;
}
