function scaledProjectionBounds(x, y, projection, scaleFactor, width, height) {
    var k = scaleFactor, p = projection;
    var N, S, E, W;
    var centroid = p.invert([x, y]);
    var original = p.invert([width / 2, height / 2]);
    var o = p.invert([0, 0]);
    W = (k * centroid[0] - original[0] + o[0]) / k;
    N = (k * centroid[1] - original[1] + o[1]) / k;
    E = 2 * centroid[0] - W;
    S = 2 * centroid[1] - N;
    return { N: N, S: S, E: E, W: W };
}