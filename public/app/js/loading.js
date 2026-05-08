function loadingTopOpen(texto, opacidade = false) {
	NProgress.start();
	if (!texto) {
		texto = "";
	}
	createFullScreenTransparentDiv(texto, opacidade);
}

function loadingTopClose() {
	NProgress.done();
	removeFullScreenTransparentDiv();
}

function createFullScreenTransparentDiv(texto, opacidade) {
	let _opacidade = `background-color: #000; opacity: 0.8;`

	if (!opacidade) {
		_opacidade = "";
	}

	$("#fullScreenTransparentDiv").remove();
	$("body").addClass("overflow-hidden").append(`
		<div id="fullScreenTransparentDiv" style="position: absolute; top: 0; left:0; min-height: 100vh; height: max-content; width: 100%; ${_opacidade} z-index: 1030; display: table;">
			<div style="display: table-cell; vertical-align: middle;">	
				<p style="color: #fff; font-size: 22px; text-align: center">
					${texto}
				</p>
			<div>
		<div>
	`);
}

function removeFullScreenTransparentDiv() {
	$("#fullScreenTransparentDiv").remove();
	$("body").removeClass("overflow-hidden");
}