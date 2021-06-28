#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
import {tables} from "./modules/tables";

interface Params {
    prueba: string;
    numeros: string;
    intervalos: string;
    alpha: string;
    media: string;
    distinto: string;
    pareja: string;
    terna: string;
}

interface Chi {
    frecEsp: number;
    frecObs : Array<number>;
    chi : Array<number>;
    estadisticoMuestral : number;
}

interface Matrix {
    total: number;
    k: number;
    matrix: Array<Array<number>>;
    couples: number;
    expected: number;
}

interface Poker {
    dif: number;
    couple: number;
    three: number;
}

parseParams(argv);

function parseParams (params: Params): void {
    const randoms: Array<number> = parseNums(params.numeros);
    const alpha: number = parseAlpha(params.alpha);
    const intervals:number = Number(params.intervalos);
    const media: number = Number(params.media);
    
    switch ( params.prueba.toLowerCase() ) {
        case "chi" :
            chiCuadrada(filterRandoms(randoms), intervals, alpha);
            break;
        case "kolmogorov" :
            kolmogorov(filterRandoms(randoms), alpha);
            break;
        case "serial" :
            serial(randoms, alpha);
            break;
        case "rachas" :
            rachas(filterRandoms(randoms), media);
            break;
        case "poker" :
            const probs : Poker = {
                dif: Number(params.distinto),
                couple: Number(params.pareja),
                three: Number(params.terna)
            }
            poker(randoms, probs, alpha);
            break;
        default :
            console.log("Por favor ingrese una prueba válida...");
    }




}






function chiCuadrada( randoms: Array<number>, intervals: number, alpha: number): boolean {
    randoms = sortNums(randoms);
    const frecEsp : number = randoms.length / intervals;
    const gradLib : number = intervals - 1;
    
    let distribution:Array<Array<number>> = [];
    for (let i = 1; i <= intervals; i++) {
        distribution.push( randoms.filter(num => num < i/intervals && num >= (i-1)/intervals ) );
    }

    console.log("------ Prueba de la Chi Cuadrada ------");
    console.log("------ Distribuciones ------");
    distribution.forEach( dist => {
        console.log(dist)
    })

    // (FO-FE)²/FE
    let estadisticoMuestral = distribution.map(dist => {
        return (dist.length - frecEsp) ** 2 / frecEsp;
    }).reduce((acc, num) => acc + num);

    console.log("------ Estadístico Muestral = " + estadisticoMuestral);
    console.log("------ α = " + alpha);
    console.log("------ Grados de libertad = " + gradLib);
    console.log(`------ Chi Cuadrada (${alpha}, ${gradLib}) = ${tables.chi[alpha][gradLib]}\n`);

    console.log("------ Resultado de la prueba ------");
    if (tables.chi[alpha][gradLib] > estadisticoMuestral) {
        console.log(`${estadisticoMuestral} < ${tables.chi[alpha][gradLib]} => SÍ CUMPLE LA PRUEBA`);
        return true;
    } else {
        console.log(`${estadisticoMuestral} < ${tables.chi[alpha][gradLib]} => NO CUMPLE LA PRUEBA`);
        return false;
    }
}

function kolmogorov (randoms : Array<number>, alpha: number): boolean {
    const n = randoms.length;
    let result : Array<number> = randoms.map( (num, index) => {
        return Math.abs( (index+1)/n - num );
    })

    let max = result.reduce( (largest, num) => largest <num ? num : largest );

    console.log("------ Prueba de Kolmogorov-Smirnov ------");
    
    console.log("------ Números Aleatorios");
    randoms.forEach( num => {
        console.log(num);
    });
    
    console.log("------ abs(i/n - random)");
    result.forEach( num => {
        console.log(num);
    });

    console.log("------ Resultado de la prueba ------");
    if (max < tables.kolmogorov[alpha][n]){
        console.log(`Kolmogorov (${alpha},${n})=${tables.kolmogorov[alpha][n]} > ${max} => SÍ CUMPLE LA PRUEBA`);
        return true;
    } else {
        console.log(`Kolmogorov (${alpha},${n})=${tables.kolmogorov[alpha][n]} > ${max} => NO CUMPLE LA PRUEBA`);
        return false;
    }
}

function chi (distribution : Array<number>) : Chi{
    const frecEsp = distribution.reduce( (acc, num) => acc + num) / distribution.length;
    // (FO-FE)²/FE
    console.log(frecEsp)
    const chi : Array<number> = distribution.map(frecObs => {
        return (frecObs - frecEsp) ** 2 / frecEsp;
    })
    const estadisticoMuestral : number = chi.reduce((acc, num) => acc + num);
    const result = chi.reduce( (acc, num) => acc + num);
    return {
        frecEsp,
        frecObs : distribution,
        chi,
        estadisticoMuestral
    };
}

function serial (randoms : Array<number>, alpha : number): boolean {
    const resultsChi : Chi = chi([...randoms]);
    const randMatrix : Matrix = parseMatrix([...randoms]);

    console.log("------ Prueba Serial ------");
    
    console.log("------ Distribuciones");
    randMatrix.matrix.forEach( row => {
        console.log(row);
    })

    console.log("------ Datos");
    console.log(`Parejas: ${randMatrix.couples}     Frec Esperada: ${randMatrix.expected}\nN=${randMatrix.total} K=${randMatrix.k}`)
    console.log(`Estadístico Muestral= ${resultsChi.estadisticoMuestral}`)
    console.log("------ Resultado ------");
    if ( tables.chi[alpha][randoms.length -1] > resultsChi.estadisticoMuestral) {
        console.log(`Chi(${alpha},${randoms.length -1}) = ${tables.chi[alpha][randoms.length -1]} > ${resultsChi.estadisticoMuestral} => SÍ CUMPLE LA PRUEBA`)
        return true;
    } else {
        console.log(`Chi(${alpha},${randoms.length -1}) = ${tables.chi[alpha][randoms.length -1]} > ${resultsChi.estadisticoMuestral} => NO CUMPLE LA PRUEBA`)
        return false;
    }

}

function rachas (randoms : Array<number>, media : number): boolean {
    const n : number = randoms.length;
    const nMenos : number = randoms.filter( num => num < 0.5).length;
    const nMas : number = n - nMenos;
    const arrayRachas : Array<string> = randoms.map( num => {
        return num < media ? "-" : "+";
    });

    let cantRachas : number = 1;
    arrayRachas.map( (num, i) => {
        if (arrayRachas[i+1] && num != arrayRachas[i+1]) {
            cantRachas++;
        }
    });

    const u : number = ((2 * nMenos * nMas) / n) + 0.5;
    const sigma : number = ((2*nMenos*nMas) * ((2*nMenos*nMas) - n)) / (n ** 2 * (n - 1))
    const z0 : number = (cantRachas - u) / Math.sqrt(sigma);

    console.log(n, nMenos, randoms, sigma, arrayRachas, cantRachas,z0,u)

    console.log("rachas");
    return true;
}

function poker (frecObservadas : Array<number>, probs : Poker, alpha : number): boolean {
    const cantidad = frecObservadas.length;
    
    // Calculo frecuencias esperadas
    const frecEsp : Array<number> = [
        cantidad * probs.dif,
        cantidad * probs.couple,
        cantidad * probs.three
    ]

    // Calculo chi cuadrada
    const chi : Array<number> = frecObservadas.map( (frecObs,i) => {
        return (frecObs - frecEsp[i]) ** 2 / frecEsp[i];
    });

    const estadisticoMuestral : number = chi.reduce((acc, num) => acc + num);
    const resultTabla : number = tables.chi[alpha][2];

    // Mostrar resultados
    console.log("------ Prueba de Poker ------");
    console.log("------ Distribuciones ------");
    frecObservadas.forEach( (frec, i) => {
        console.log(`${Object.keys(frecEsp)[i]}FO --> ${frec}     FE --> ${frecEsp[i]}`)
    });

    console.log("------ Resultado ------");
    if ( resultTabla > estadisticoMuestral) {
        console.log(`${resultTabla} > ${estadisticoMuestral} => SÍ SE CUMPLE LA PRUEBA`);
        return true;
    } else {
        console.log(`${resultTabla} > ${estadisticoMuestral} => NO SE CUMPLE LA PRUEBA`);
        return false;
    }
}

function parseNums (nums: string) : Array<number>{
    // Convertimos el string a un array de strings
    let stringArray = nums.split(",");
    // Convertimos el array de strings en array de números
    let parsedNums: Array<number> = stringArray.map(num => Number(num));
    return parsedNums;
}

function sortNums (nums: Array<number>) : Array<number>{
    return nums.sort((a,b) => a - b);
}

function parseMatrix (randoms : Array<number>) : Matrix {
    const k : number = Math.sqrt(randoms.length);
    const couples : number = randoms.reduce( (acc, num) => acc + num);
    const total : number = couples * 2;
    const matrix : Array<Array<number>> = []; 
    const expected : number = couples / (k ** 2);
    for (let i = 1; i <= k; i++) {
        matrix.push(randoms.splice(0, k));
    }


    return {
        matrix,
        total,
        couples,
        k,
        expected
    }
}

function filterRandoms (parsedNums : Array<number>) : Array<number>{
    // Retornamos los números entre (0;1)
    return parsedNums.filter( random => {
        if (random >= 0 && random < 1) {
            return random;
        }
    });
}

function parseAlpha (stringAlpha: string): number {
    let alpha: number = Number(stringAlpha);
    if (alpha > 1 && alpha < 100) {
        alpha = alpha / 100;
    }

    return alpha;
}