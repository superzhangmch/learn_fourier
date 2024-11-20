import FFT from 'fft.js';
import { slurp } from './util.js';

/**
 * Do the fourier thing using a bunch of complex points
 *
 * @param {Array<Number>} points Array of points, alternative with re, im pairs【所以re, im 就是{x,y}坐标点了】. Length must be a power of 2
 */
export function getFourierData(points) {
    if (points.length == 0) {
        return [];
    }
    const numPoints = points.length / 2;
    const fft = new FFT(numPoints);

    const out = fft.createComplexArray();
    fft.transform(out, points);
    /*
    快速傅里叶变换（FFT）的输入和输出主要涉及到复杂数的序列。具体来说：
    输入:
    时域信号：通常是一个实数或复数序列。这个序列代表的是信号在时域上的采样值。
    长度：FFT 的输入长度通常是 2 的幂次方（例如 256、512、1024 等），因为这样可以利用 FFT 算法的效率。对于非 2 的幂次长度的信号，可以通过零填充（zero-padding）来扩展信号长度。
    输出:
    频域信号：输出是一个复数序列，每个复数代表一个频率分量的幅度和相位。
    
    幅度（Magnitude）：通过计算复数的模，可以得到每个频率分量的幅度。
    相位（Phase）：通过计算复数的辐角，可以得到每个频率分量的相位。
    频率分辨率：输出序列的长度与输入相同。对于实数输入，输出通常是对称的，其中前半部分代表正频率，后半部分代表负频率（在某些实现中，负频率部分可能会被省略）。
    
    FFT 的主要用途是将时域信号转换为频域信号，使得信号分析、滤波、频谱分析等变得更加方便和直观。
    */

    // Transform into an API of points I find friendlier.
    const fftData = [];
    for (let i = 0; i < numPoints; i ++) {
        // to reorder the frequencies a little nicer, we pick from the front and back altermatively
        const j = i % 2 == 0 ? i / 2 : numPoints - ((i+1) / 2);
        const x = out[2 * j];
        const y = out[2 * j + 1];
        const freq = ((j + numPoints / 2) % numPoints) - numPoints / 2;
        fftData.push({
            freq: freq,                                      // FFT 返回的数组的每一个元素对应一定频率
            // a little expensive
            amplitude: Math.sqrt(x * x + y * y) / numPoints, // FFT 返回的数组的每一个元素的取值，决定了一定频率下的振幅与相位(phase)
            // a lottle expensive :(
            phase: Math.atan2(y, x),
        });
    }
    // fftData.sort((a, b) => b.amplitude - a.amplitude);
    return fftData;
}

/**
 *
 * @param {Array<Number>} points Array of values of some wave. Must be a power of 2.
 */
export function getRealFourierData(points) {
    if (points.length == 0) {
        return [];
    }
    const numPoints = points.length;
    const fft = new FFT(numPoints);

    const formatedPoints = fft.createComplexArray();
    fft.toComplexArray(points, formatedPoints);

    const out = fft.createComplexArray();
    fft.transform(out, formatedPoints);

    // Transform into an API of points I find friendlier.
    const fftData = [];
    // We only have to read the first half of this because of symmetry things.
    for (let i = 0; i < numPoints / 2; i ++) {
        const x = out[2 * i];
        const y = out[2 * i + 1];
        const freq = i;
        fftData.push({
            freq: freq,
            // a little expensive
            // Also we gotta multiply this by 2 to account for the other side that
            amplitude: 2 * Math.sqrt(x * x + y * y) / numPoints,
            // a lottle expensive :(
            phase: Math.atan2(y, x),
        });
    }
    // fftData.sort((a, b) => b.amplitude - a.amplitude);
    return fftData;
}

/**
 * Transforms a list of x, y points into input appropriate for a fourier transform.
 */
export function resample2dData(points, numSamples) {
    /*
    不管原来有多少个{x, y} 点，把 points 整成 numSamples 个 {x, y} 点。为保持弄完后首位相连画出的图要和处理前画出的尽量一样，新点要在旧点基础上插值拿到
    */
    if (points.length == 0) {
        // Can't resample if we don't have ANY points
        return [];
    }
    let newPoints = [];
    for (let i = 0; i < numSamples; i ++) {
        let position = points.length * (i / numSamples);
        let index = Math.floor(position);
        let nextIndex = (index + 1) % points.length;
        let amt = position - index;
        newPoints.push(
            /* x */ slurp(points[index].x, points[nextIndex].x, amt), // slurp: function slurp(val1, val2, amt) {return (val2 - val1) * amt + val1;}, 即作插值拿到新点位置
            /* y */ slurp(points[index].y, points[nextIndex].y, amt),
        )
    }
    return newPoints;
}
