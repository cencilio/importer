/*Please notice this module needs a API Key, get it in app.cencilio.com.*/


class DOMNodeFactors {
  constructor() {
    this.childs = [];
    this.critical = false;
	this.unique = false; 
    this.re = false;
	this.error = '';
	this.logic = [];
	this.list = [];
  }
}
class ElReqs {
  constructor() {
	this.label = "";
    this.key = "";
    this.required = false;
    this.unique = false;
    this.error = false;
    this.regex = false;
	this.conditional = false;
  }
}

function send_data_processed() {
	/* add to workbook */
	let filename = document.getElementById('cencilio_file_name').innerHTML;
	var fileInput = document.getElementById('pIn').files[0];
	document.getElementById('export_confirmation_cencilio').style.display = 'none';
	document.getElementById('loading_data_cencilio').style.display = 'block';
	document.getElementById('loading_subtitle_cencilio').innerHTML = filename;
	var wb = XLSX.utils.book_new();
	var reader = new FileReader();

	if (typeof renderer.check_transversal !== 'undefined') {
		this.editing = renderer.check_transversal; //user basis
	}
	else {
		this.editing = renderer.page; //program basis
	}
	try {
		let data_rows = [];
		for (var R = 0; R < renderer.excel_data[this.editing].length; R++) {
			let row_values = {};
			if (!document.getElementById('render_row_' + R).discarded) {

				for (var C = 0; C < renderer.excel_data[this.editing][R].length; C++) {
					try {
						let field_selected = document.getElementById('select_all_selector_' + C);
						if (field_selected.value != '--') {
							this.key = field_selected.value;
							this.data = (renderer.excel_data[this.editing][R][C] !== null) ? renderer.excel_data[this.editing][R][C] : '';
							row_values[this.key]= this.data;
						} else {
							continue
						}


					}
					catch (error) {
						this.key = 'New';	//system key
						this.data = '';
						console.info(error);
					}

				}
			} else {
				continue;
			}

			data_rows.push(row_values);

		}

		let JSON_OBJ = '{"userId":"'+renderer.config['userId']+'","sheet'+this.editing +'":{"rows":'+JSON.stringify(data_rows)+'}}';
		let jsonString = JSON.stringify(JSON_OBJ);				

		var xhr = new XMLHttpRequest();
		xhr.open("POST", 'https://app.cencilio.com/api/1.1/wf/save_file');
		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Authorization", "Bearer dce1d75924fcda75937d1641e71ddada");
		xhr.setRequestHeader("Content-Type", "application/json");

		reader.readAsDataURL(fileInput);
		reader.onload = function () {
			if (reader.readyState === 2) {

				var data = `{
							"account":"${renderer.config['apiKey']}",
							"filename":"${filename}",
							"user_id":"${renderer.config['userId']}",
							"response":${jsonString},
							"key_file": {
								"filename":"${filename}",
								"contents":"${reader.result.split(',')[1]}"
								}
							}`;
				xhr.send(data);

			}
		};

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4 && xhr.status === 200) {
				callback_data_processed(JSON_OBJ);
				return true;
			} else if (xhr.readyState === 1 || xhr.readyState === 2 || xhr.readyState === 3) {
				console.log('Se estan procesando los datos, espera unos segundos');
			} else {
				console.log(xhr.responseText);
				console.log('Hay un error al momento de procesar los dato por Cencilio');
				return null;
			}
		};
		xhr.upload.addEventListener("load", function () {
			document.getElementById('loadng_progress_bar_cencilio').style.width = '100%';
		});
		xhr.upload.addEventListener("progress", function (event) {
			if (event.lengthComputable) {
				var complete = (event.loaded / event.total * 100 | 0);
				document.getElementById('loadng_progress_bar_cencilio').style.width = complete + '%';
			}
		});



	}
	catch (error) {
		console.info(error);
		alert('Imposible procesar los datos, contactar a soporte de Cencilio');
		return null;
	}
}

function validate_data_processed() {
	//validar acá si ya se hizo el mapeo de los requeridos y si hay errores aún
	//Validar si el mapeo de los campos rqueridos esta hecho
	//Luego validar si las celdas mapeadas no tienen errores
	let selectors = document.getElementById('sheetFieldSelector').childNodes;
	let mapped = true;
	let corrected = true;
	for (var select = 1; select <= selectors.length - 1; select++) {
		if (!selectors[select].childNodes[0].childNodes[0].value) {
			mapped = false;
		}
	}
	renderer.falsable_cells[renderer.page].forEach((e, index) => {
		// si render_row_ + e index. discarded is true skip the next for each loop
		if (document.getElementById('render_row_' + index).discarded === true) return;
		e.forEach(i => {
			if(i){
				corrected = false;
			}
		});
	});

	if (mapped && corrected) {
		document.getElementById('export_confirmation_cencilio').style.display = 'block';
		renderer.set_virtual = true;
		return true;
	} else if(!mapped && corrected){
		document.getElementById("modals_subtitle_cencilio_text").innerHTML = 'Aún existen columnas sin emparejar con los campos.';
		document.getElementById('export_warning_cencilio').style.display = 'block';
	}else if(mapped && !corrected){
		document.getElementById("modals_subtitle_cencilio_text").innerHTML = 'Aún existen valores con error';
		document.getElementById('export_warning_cencilio').style.display = 'block';
	} else{
		document.getElementById("modals_subtitle_cencilio_text").innerHTML = 'Aún existen valores con error y columnas sin emparejar con los campos.';
		document.getElementById('export_warning_cencilio').style.display = 'block';
		return false;
	}
}

function data_exported() {
	document.getElementById('data_exported').style.display = 'none';
	window.location.href = renderer.config['callback']['redirect_url'];
}

function callback_data_processed(data){
	var xhr = new XMLHttpRequest();
	xhr.open(renderer.config['callback']['callback_method'], renderer.config['callback']['callback_url']);
	xhr.setRequestHeader("Accept", "application/json");
	xhr.setRequestHeader(renderer.config['callback']['callback_token_key'], renderer.config['callback']['callback_token_value']);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(data);

	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4 && xhr.status === 200) { //Here validate if the response include the error's flag
			console.log('Data enviada');
			document.getElementById('sheet_div').remove();
			document.getElementById('loading_data_cencilio').style.display = 'none';
			document.getElementById('data_exported').style.display = 'block';
			return true;
		} else if (xhr.readyState === 1 || xhr.readyState === 2 || xhr.readyState === 3) {
			console.log('Se estan procesando los datos, espera unos segundos');
		} else {
			console.log(xhr.response);
			document.getElementById('sheet_div').remove();
			document.getElementById('loading_data_cencilio').style.display = 'none';
			document.getElementById("modals_subtitle_cencilio_text").innerHTML = 'Error 404: No se pudo cargar los datos correctamente, por favor contacta al equipo de soporte.';
			document.getElementById('export_warning_cencilio').style.display = 'block';
			return null;
		}
	};
}
function errorCell(idx) {
	/*Función que coloriza en rojo una celda
	con placeholder de required inválido*/
	idx.style.backgroundColor = renderer.config['theme']['global']['errorColor'];
}


function conditionalValidation(logic, value, logic_value) {
	/* logic: la logica a aplicar
	value: el valor de la celda a validar
	logic_value: el valor para la logica a aplicar
	 */
	let clean_value = (!isNaN(value) && value !== "") ? parseFloat(value): value;
	let clean_logic_value = (!isNaN(logic_value) && logic_value !== "") ? parseFloat(logic_value): logic_value;

	switch (logic) { //validando tipo de logica a aplicar
		case "===": //Debe ser
			return clean_value === clean_logic_value;
			
		case "!==": //Debe NO ser
			return clean_value !== clean_logic_value;
			
		case ">": //Debe ser mayor a
			return clean_value > clean_logic_value;
			
		case "<": //Debe ser menor a
			return value < clean_logic_value;
			
		case ">=": //Debe ser mayor o igual a
			return clean_value >= clean_logic_value;
			
		case "<=": //Debe ser menor o igual a
			return clean_value <= clean_logic_value;
			
		case "startsWith": //Debe iniciar con
			return clean_value.startsWith(clean_logic_value);
			
		case "endsWith": //Debe finalizar con
			return clean_value.endsWith(clean_logic_value);
			
		default:
			return false;
			
	}
}

function find_and_replace(ov,nv,col) {
	let rows = document.getElementById('sheet_rows').childNodes;
	for (let R = 0; R < rows.length; R++) {
		const value = rows[R].childNodes[col+1].childNodes[0].value;

		if (value === ov) {
			rows[R].childNodes[col+1].childNodes[0].value = nv;
			//Ahora vamos provar/validar
			let ev = {};
			ev.target = rows[R].childNodes[col+1].childNodes[0];
			rows[R].childNodes[col+1].childNodes[0].onblur(ev);
		}
	}	
	document.getElementById('find_replace_cencilio').remove();
}

function findReplaceModal(originValue,C,list) {
	
	let findReplaceModal = document.createElement('div');
	findReplaceModal.id = 'find_replace_cencilio';
	findReplaceModal.className = 'modals_cencilio_style';
	findReplaceModal.style.display = 'block';
	findReplaceModal.style.height = 'auto';

	let findReplaceTitle = document.createElement('p');
	findReplaceTitle.className = 'modals_title_cencilio_style';
	findReplaceTitle.innerHTML = 'Corregir el valor: '+originValue+' en todas las filas en las que exista';

	let findReplaceSubtitle = document.createElement('p');
	findReplaceSubtitle.className = 'modals_subtitle_cencilio_style';
	findReplaceSubtitle.id = 'findReplace_subtitle_cencilio_text';
	findReplaceSubtitle.innerHTML = 'Escribe el nuevo valor por el cual deseas corregir el valor: '+originValue+'; la corrección se aplicara en todas las filas donde exista el valor original';

	let replaceInput = document.createElement('input');
	replaceInput.type = 'text'
	replaceInput.className = 'find_replace_input_cencilio';
	replaceInput.placeholder = 'Escribe el nuevo valor aquí...'

	let findReplaceBtnsDiv = document.createElement('div');
	findReplaceBtnsDiv.id = 'export_warning_btns_div';
	findReplaceBtnsDiv.style = 'display: flex;';

	let findReplaceClose = document.createElement('button');
	findReplaceClose.type='button';
	findReplaceClose.className = 'modal_btns'; 
	findReplaceClose.innerHTML = 'CERRAR';
	findReplaceClose.onclick = function (){
	document.getElementById('find_replace_cencilio').remove();
	}

	let findReplaceconfirm = document.createElement('button');
	findReplaceconfirm.id = 'find_replace_btn';
	findReplaceconfirm.className = 'modal_btns';
	findReplaceconfirm.type='button'; 
	findReplaceconfirm.innerHTML = 'CORREGIR ';
	findReplaceconfirm.onclick = function () {
		findReplaceconfirm.classList.add("button-loading-cencilio");
		setTimeout(() => {
			find_and_replace(originValue,replaceInput.value,C);
		}, 2000);
		
	};

	findReplaceBtnsDiv.appendChild(findReplaceClose);
	findReplaceBtnsDiv.appendChild(findReplaceconfirm);
	findReplaceModal.appendChild(findReplaceTitle);
	findReplaceModal.appendChild(findReplaceSubtitle);
	findReplaceModal.appendChild(replaceInput);
	findReplaceModal.appendChild(findReplaceBtnsDiv);
	document.body.appendChild(findReplaceModal);
}

function addSelectList(element, parent, options,destination) {
	let container_list = document.createElement('div');
	let list = document.createElement('ul');
	let ev = {};
	ev.target = destination;
	container_list.className = 'static-value-list';
	container_list.style.width = element.offsetWidth + 'px';
	container_list.style.top = (element.offsetTop+element.offsetHeight-parent.scrollTop) + 'px';
	container_list.style.left = (element.offsetLeft-parent.scrollLeft) + 'px';
	container_list.appendChild(list);
	options.forEach(e => {
		let options = document.createElement('li');
		options.innerHTML = e;
		options.onclick =  function (e){
			destination.value = e.target.innerText;
			destination.onblur(ev);
			container_list.remove();
		};
		list.appendChild(options);
	});
	
	parent.appendChild(container_list);
	
}

var _Utils = function ()
{
    this.findChildById = function (element, childID, isSearchInnerDescendant) // isSearchInnerDescendant <= true for search in inner childern 
    {
        var retElement = null;
        var lstChildren = isSearchInnerDescendant ? Utils.getAllDescendant(element) : element.childNodes;
        for (var i = 0; i < lstChildren.length; i++)
        {
            if (lstChildren[i].id == childID)
            {
                retElement = lstChildren[i];
                break;
            }
        }
        return retElement;
    }
    this.getAllDescendant = function (element, lstChildrenNodes)
    {
        lstChildrenNodes = lstChildrenNodes ? lstChildrenNodes : [];
        var lstChildren = element.childNodes;
        for (var i = 0; i < lstChildren.length; i++) 
        {
            if (lstChildren[i].nodeType == 1) // 1 is 'ELEMENT_NODE'
            {
                lstChildrenNodes.push(lstChildren[i]);
                lstChildrenNodes = Utils.getAllDescendant(lstChildren[i], lstChildrenNodes);
            }
        }
        return lstChildrenNodes;
    }        
}
var Utils = new _Utils;
//AS THREAD
function table_maker(Options, workbook){
	//Usando los campos del objeto en JSON
	//devuelve un objeto que contiene la
	//representación de esos datos en el DOM
	//user without setting options

	if (typeof Options !== 'object'){
		document.getElementById('api_error').style.display = 'block';   
		document.getElementById('spinner').style.display = 'none';
		return 'validationError';
	}
	renderer.dom_factor = [];
	let sheetDiv = document.createElement('div');
	sheetDiv.id = 'sheet_div';
	document.body.appendChild(sheetDiv);
	// Contenedor de HEADER de tabla
	let sheetDivChildDiv = document.createElement('div');
	sheetDivChildDiv.id = 'header_xlsx';

	//Prime fila de HEADER
	let sheetHeaderChildRow1 = document.createElement('div');
	sheetHeaderChildRow1.className = 'cencilio_row';

	let sheetHeaderChildCol1 = document.createElement('div');
	sheetHeaderChildCol1.className = 'cencilio-col';

	let sheetHeaderChildCol2 = document.createElement('div');
	sheetHeaderChildCol2.className = 'cencilio-col';

	// Nombre de archivo
	let sheetDivChildStrong = document.createElement('strong');
	sheetDivChildStrong.id = 'cencilio_file_name';
	sheetDivChildStrong.innerHTML = '';
	sheetHeaderChildCol1.appendChild(sheetDivChildStrong);

	//SELECT DE HOJAS
	let sheetDivChildInput = document.createElement('select');
	sheetDivChildInput.id = 'sheet_select';
	sheetDivChildInput.placeholder = 'Nombre de hoja';

	//change page
	sheetDivChildInput.onchange = function (e) {
		let sheet = renderer.loadTable(workbook.SheetNames.indexOf(e.target.value));
		renderer.page = 0;
		for (var c = 2; c <= document.getElementById('sheet_div').length; ++c) {
			document.getElementById('sheet_div').childNodes[c] = sheet[c - 2];
		}
		renderer.page_shift = false;
	}

	//Label Select de hojas
	let selectSheetsLabel = document.createElement('strong');
	selectSheetsLabel.id = 'select_sheet_label';
	selectSheetsLabel.innerHTML = '  |  Hojas:  ';
	sheetHeaderChildCol1.appendChild(selectSheetsLabel);
	sheetHeaderChildCol1.appendChild(sheetDivChildInput);

	//Boton de cerrar
	let closeRenderer = document.createElement('button');
	closeRenderer.id = 'close_sheet';
	closeRenderer.onclick = function (e) {
		document.getElementById('sheet_div').remove();
		renderer.set_virtual = true; //user decides to rebuild context	
	}

	let closeImg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	let iconClosePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	closeImg.setAttribute('fill', Options['theme']['global']['primaryButtonColor']);
	closeImg.setAttribute('viewBox', '0 0 24 24');
	closeImg.setAttribute('width', '24px');
	closeImg.setAttribute('height', '24px');
	closeImg.classList.add('post-icon');
	iconClosePath.setAttribute(
		'd',
		'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
	);
	closeImg.appendChild(iconClosePath);
	closeRenderer.appendChild(closeImg);
	sheetHeaderChildCol2.appendChild(closeRenderer);


	//SEGUNDA FILA de Header
	let sheetHeaderChildRow2 = document.createElement('div');
	sheetHeaderChildRow2.className = 'cencilio_row';

	let sheetHeaderChildCol3 = document.createElement('div');
	sheetHeaderChildCol3.className = 'cencilio-col-70';

	let sheetHeaderChildCol4 = document.createElement('div');
	sheetHeaderChildCol4.className = 'cencilio-col-30';

	//Instrucciones
	let sheetDivInstructionTitle = document.createElement('p');
	sheetDivInstructionTitle.id = 'cencilio_title_instructions';
	sheetDivInstructionTitle.innerHTML = 'Instrucciones:';
	let sheetDivInstructions = document.createElement('ol');
	sheetDivInstructions.id = 'cencilio_instructions';
	sheetDivInstructions.innerHTML = `<li>Empareja el campo que coincide con cada columna y corrobora que no quede ninguna celda con errores</li>
			<li>Deselecciona las filas que NO quieres cargar</li>
			<li>Cuando estés listo, haz click en cargar datos</li>`;
	sheetHeaderChildCol3.appendChild(sheetDivInstructionTitle);
	sheetHeaderChildCol3.appendChild(sheetDivInstructions);

	sheetHeaderChildRow1.appendChild(sheetHeaderChildCol1);
	sheetHeaderChildRow1.appendChild(sheetHeaderChildCol2);
	sheetDivChildDiv.appendChild(sheetHeaderChildRow1);
	sheetHeaderChildRow2.appendChild(sheetHeaderChildCol3);
	sheetHeaderChildRow2.appendChild(sheetHeaderChildCol4);
	sheetDivChildDiv.appendChild(sheetHeaderChildRow2);

	//Mensaje de Sólo fila invalida
	let sheetDivSpan2 = document.createElement('span');
	sheetDivSpan2.innerHTML = 'Sólo fila inválida';
	sheetDivSpan2.style = 'margin-top: -140px;position: absolute;margin-left: 32px;font-size: 80%;';

	//Contenedor de MENSAJE
	let sheetDivGrandChildOptionsDiv2 = document.createElement('div');
	sheetDivGrandChildOptionsDiv2.style = 'overflow-y: scroll; overflow-x: hidden; max-height: 144px;';
	sheetDivGrandChildOptionsDiv2.id = 'mensajes';

	sheetDiv.appendChild(sheetDivChildDiv);

	// Page_Table Container
	let sheetPageTableContainer = document.createElement('div');
	sheetPageTableContainer.id = 'page_table_container';

	//FILA de PAGE_TABLE
	let sheetPageTableChildRow = document.createElement('div');
	sheetPageTableChildRow.className = 'cencilio_row';
	sheetPageTableChildRow.id = 'page_table_row';

	let sheetPageTableChildCol1 = document.createElement('div');
	sheetPageTableChildCol1.className = 'cencilio-col';

	let sheetPageTableChildCol2 = document.createElement('div');
	sheetPageTableChildCol2.className = 'cencilio-col';
	sheetPageTableChildCol2.style = "text-align:right;";

	// Texto de total de filas con y sin errores
	let sheetHeaderSelectsContainer = document.createElement('div');
	sheetHeaderSelectsContainer.id = "rows_counter_container";
	let sheetDivGrandChildSpan = document.createElement('span');
	sheetDivGrandChildSpan.id = 'total_sheets';
	sheetDivGrandChildSpan.innerHTML = 'Total celdas: 0 | ';
	let sheetDivGrandChildSpan2 = document.createElement('span');
	sheetDivGrandChildSpan2.id = 'error_sheets';
	sheetDivGrandChildSpan2.innerHTML = 'Con errores:';
	sheetHeaderSelectsContainer.appendChild(sheetDivGrandChildSpan);
	sheetHeaderSelectsContainer.appendChild(sheetDivGrandChildSpan2);
	sheetPageTableChildCol2.appendChild(sheetHeaderSelectsContainer);

	sheetPageTableChildRow.appendChild(sheetPageTableChildCol1);
	sheetPageTableChildRow.appendChild(sheetPageTableChildCol2);

	// Filter button
	let filtersButton = document.createElement('button');
	filtersButton.id = 'filter_rows_btn';
	filtersButton.onclick = function (e) {
		var content = document.getElementById("filters_rows_container");;
		if (content.style.display === "block") {
			content.style.display = "none";
		} else {
			content.style.display = "block";
		}
	}

	let filterSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	let filterPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	filterSVG.setAttribute('fill', Options['theme']['global']['primaryButtonColor']);
	filterSVG.setAttribute('viewBox', '0 0 20 20');
	filterSVG.setAttribute('width', '20px');
	filterSVG.setAttribute('height', '20px');
	filterPath.setAttribute(
		'd',
		'M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z'
	);
	filterPath.setAttribute('fill-rule', 'evenodd');
	filterPath.setAttribute('clip-rule', 'evenodd');
	filterSVG.appendChild(filterPath);
	filtersButton.appendChild(filterSVG);
	filterSVG.insertAdjacentText("afterend", "FILTRAR");
	sheetHeaderSelectsContainer.appendChild(filtersButton);

	//Filters for rows container
	let filtersRowsContainer = document.createElement('div');
	filtersRowsContainer.id = "filters_rows_container";
	sheetPageTableChildCol2.appendChild(filtersRowsContainer);

	let filtersRowsTitle = document.createElement('p');
	filtersRowsTitle.innerText = "Filas:";
	let filtersRowsDivisor = document.createElement('hr');
	filtersRowsContainer.appendChild(filtersRowsTitle);
	filtersRowsContainer.appendChild(filtersRowsDivisor);

	//Filtros de checkbox
	let sheetDivCheckChangedContainer = document.createElement('div');
	let sheetDivCheckInvalidContainer = document.createElement('div');

	let sheetDivCheckChanged = document.createElement('input');
	sheetDivCheckChanged.id = 'show_changed';
	sheetDivCheckChanged.type = 'checkbox';
	//view changed
	sheetDivCheckChanged.onclick = function (e) {
		renderer.render_edited_page(e.target.checked);
	};

	let sheetDivCheckChangedLabel = document.createElement('label');
	sheetDivCheckChangedLabel.id = 'show_changed_label';
	sheetDivCheckChangedLabel.htmlFor = 'show_changed';
	sheetDivCheckChangedLabel.innerHTML = ' Editadas';


	let sheetDivCheckInvalid = document.createElement('input');
	sheetDivCheckInvalid.id = 'show_errors';
	sheetDivCheckInvalid.name = 'show_errors';
	sheetDivCheckInvalid.type = 'checkbox';
	//view errors
	sheetDivCheckInvalid.onclick = function (e) {
		renderer.render_invalid_page(e.target.checked);
	};
	let sheetDivCheckInvalidLabel = document.createElement('label');
	sheetDivCheckInvalidLabel.id = 'show_errors_label';
	sheetDivCheckInvalidLabel.htmlFor = 'show_errors';
	sheetDivCheckInvalidLabel.innerHTML = ' Con errores';


	sheetDivCheckChangedContainer.appendChild(sheetDivCheckChangedLabel);
	sheetDivCheckChangedContainer.appendChild(sheetDivCheckChanged);
	sheetDivCheckInvalidContainer.appendChild(sheetDivCheckInvalidLabel);
	sheetDivCheckInvalidContainer.appendChild(sheetDivCheckInvalid);
	filtersRowsContainer.appendChild(sheetDivCheckChangedContainer);
	filtersRowsContainer.appendChild(sheetDivCheckInvalidContainer);

	//TABLA DE RENDERIZADO DE EXCEL
	let sheetDivTable = document.createElement('table');
	let sheetDivHead = document.createElement('thead');
	sheetDivHead.id = 'sheet_headers';
	let sheetDivTableBody = document.createElement('tbody');
	sheetDivTableBody.id = 'sheet_rows';

	//Contenedor de tabla
	let tableScrollDiv = document.createElement('div');
	tableScrollDiv.id = 'page_table';

	tableScrollDiv.appendChild(sheetDivTable);

	sheetPageTableContainer.appendChild(sheetPageTableChildRow);
	sheetPageTableContainer.appendChild(tableScrollDiv);
	sheetDiv.appendChild(sheetPageTableContainer);




	//Footer_sheetDiv
	let sheetFooterDiv = document.createElement('div');
	sheetFooterDiv.id = 'footer_sheetdiv';
	//PRIMER FILA de Footer
	let sheetFooterChildRow1 = document.createElement('div');
	sheetFooterChildRow1.className = 'cencilio_row';
	let sheetFooterChildCol1 = document.createElement('div');
	sheetFooterChildCol1.className = 'cencilio-col';
	let sheetFooterChildCol2 = document.createElement('div');
	sheetFooterChildCol2.className = 'cencilio-col';
	//Boton de cargar
	let sheetDivGrandChildButton = document.createElement('button');
	sheetDivGrandChildButton.id = 'cargar_btn_cencilio';
	sheetDivGrandChildButton.type = 'button';
	sheetDivGrandChildButton.name = 'cargar';
	sheetDivGrandChildButton.className = 'cargar_cencilio';
	sheetDivGrandChildButton.innerHTML = 'CARGAR DATOS';
	sheetDivGrandChildButton.onclick = validate_data_processed;
	sheetFooterChildCol2.appendChild(sheetDivGrandChildButton);
	sheetFooterChildRow1.appendChild(sheetFooterChildCol1);
	sheetFooterChildRow1.appendChild(sheetFooterChildCol2);
	sheetFooterDiv.appendChild(sheetFooterChildRow1);
	sheetDiv.appendChild(sheetFooterDiv);

	//Style
	sheetDivGrandChildButton.style.backgroundColor = Options['theme']['global']['primaryButtonColor'];
	sheetDivGrandChildButton.style.color = Options['theme']['global']['primaryTextColor'];
	sheetDiv.style.backgroundColor = Options['theme']['global']['backgroundColor'];
	sheetDiv.style.color = Options['theme']['global']['textColor'];
	sheetDivChildStrong.style.color = Options['theme']['global']['textColor'];
	document.getElementById('close_button').style.backgroundColor = Options['theme']['global']['primaryButtonColor'];
	document.getElementById('close_button').style.color = Options['theme']['global']['primaryTextColor'];
	document.getElementById('data_exported').style.backgroundColor = Options['theme']['global']['backgroundColor'];
	document.getElementById('ppbutton').style.backgroundColor = Options['theme']['global']['backgroundColor'];
	document.getElementById('data_exported').style.color = Options['theme']['global']['textColor'];
			
	let sheetFieldSelector = document.createElement('tr');
	sheetFieldSelector.id = 'sheetFieldSelector';
	let sheetDivTableD = document.createElement('th');
	sheetDivTableD.id = 'show_changed_container';
	let sheetDivTableDIn = document.createElement('input');
	sheetDivTableDIn.id = 'select_all';
	//unclick or click all rows as a user option
	sheetDivTableDIn.onchange = function (e) {
		if (renderer.excel_data.length === 0) {
			this.Size = this.range;
		}
		else {
			this.Size = renderer.excel_data[0].length;
		}
		for (var i = 0; i < this.Size; i++) {
			if (document.getElementById('render_row_' + String(i)) !== null) {
				document.getElementById('render_row_' + String(i)).click();
			}
		}
	};

	sheetDivTableDIn.type = 'checkbox';
	sheetDivTableDIn.click();
	sheetDivTableD.appendChild(sheetDivTableDIn);
	sheetFieldSelector.appendChild(sheetDivTableD);
	sheetDivHead.appendChild(sheetFieldSelector);

	sheetDivTable.appendChild(sheetDivHead);
	sheetDivTable.appendChild(sheetDivTableBody);

	renderer.dom_factor = [];
	let fields = Options['fields'];
	for (var j = 0; j < fields.length; j++) {
		//console.info(renderer.dom_factor);
		if (typeof fields[j]['validators'] !== 'undefined') {
			let validators = new ElReqs();
			validators.label = fields[j]['label'];
			validators.key = fields[j]['key'];
			for (var set = 0; set < fields[j]['validators'].length; set++) {
				renderer.ndata = new DOMNodeFactors();
				try {
					if (fields[j]['validators'][set]['validate'] === 'required') {
						validators.required = true;
						renderer.ndata.critical = true;	
					}
					if (fields[j]['validators'][set]['validate'] === 'unique') {
						validators.unique = true;
						renderer.ndata.unique = true;	
					}
					if (fields[j]['validators'][set]['validate'] === 'regex_match') {
						validators.regex = true;
						renderer.ndata.re = fields[j]['validators'][set].regex;
						renderer.ndata.list.push(...fields[j]['validators'][set].list);
					}
					if (fields[j]['validators'][set]['validate'] === 'conditional') {
						validators.conditional = true;
						renderer.ndata.logic.push(...fields[j]['validators'][set].logics);
					}
					if (typeof fields[j]['validators'][set]['error'] !== 'undefined') {
						validators.error = true;
						renderer.ndata.error = fields[j]['validators'][set]['error'];
					}

					if (renderer.dom_factor.length <= j) {
						renderer.dom_factor.push([]);
						renderer.dom_factor[renderer.dom_factor.length - 1].push(renderer.ndata);
					}
					else {
						renderer.dom_factor[j].push(renderer.ndata);
					}


				}
				catch (error) {
					console.info(error);
				}
			}
			renderer.dom_factor[j].push(validators);
		}
		else {
			let validators = null;
		}
	}
	
	for (var sh = 0; sh < workbook.SheetNames.length; sh++) {
		try {
			var sheet = workbook.Sheets[workbook.SheetNames[sh]]; // get the first worksheet
			renderer.page_names.push(workbook.SheetNames[sh]);
			let pageOption = document.createElement('option');
			pageOption.value = workbook.SheetNames[sh];
			pageOption.innerHTML = workbook.SheetNames[sh];
			sheetDivChildInput.appendChild(pageOption);
			var range = XLSX.utils.decode_range(sheet['!ref']); // get the range
			let page_data = [];

			/* loop through every cell manually */
			for (var R = range.s.r; R <= range.e.r; ++R) { //R = row   
				if (typeof renderer.falsable_cells[sh] === 'undefined') {
					renderer.falsable_cells.push([]);
				}
				page_data.push([]);
				renderer.falsable_cells[sh].push([]);
				for (var C = range.s.c; C <= range.e.c; ++C) { //C = col
					/* find the cell object */
					var cellref = XLSX.utils.encode_cell({ c: C, r: R }); // construct A1 reference for cell
					if (!sheet[cellref]) { // if cell reference doesn't exist add an empty value
						page_data[R].push("");
						renderer.falsable_cells[sh][R][C] = false;
					} else {
						var cell = sheet[cellref];
						let v = String(cell.w).trim(); //string parse the value in cell and removes whitespace from both ends of a string.
						page_data[R].push(v);
						renderer.falsable_cells[sh][R][C] = false;
					} 

				}
			}
			//copying original information 
			//var poc_json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[sh]],{raw:false, header:1});
			renderer.excel_data[sh] = page_data; //element-wise			


		}
		catch (error) { //looping sums 1
			console.info(error);
		}
	}

	renderer.page = 0;
	renderer.deep_excel_data = JSON.parse(JSON.stringify(renderer.excel_data));


	renderer.prev_exp = 0; //start transversal		
	let sheet1 = renderer.loadTable(0);

	for (var vtypei = 0; vtypei < renderer.tableSize; vtypei++) { //test inside (not from) table
		let tdFieldSelector = document.createElement('th');
		let tdLabelShiftDiv = document.createElement('div');
		let tdLabelSelector = document.createElement('select');
		tdLabelSelector.id = 'select_all_selector_' + String(vtypei);
		tdLabelSelector.choices = [];
		tdLabelSelector.style = 'border: 1px solid '+Options['theme']['global']['primaryButtonColor']+';';
		
		tdLabelSelector.onchange = function (e) {
			try {
				let children = e.target.choices;
				this.selectors = document.getElementById('sheetFieldSelector').childNodes;
				let dom_index = e.target.choices.indexOf(e.target.value);
				if(e.target.prev === '--' && e.target.value !== '--'){
					for (var vtypec = 1; vtypec <= this.selectors.length - 1; ++vtypec) {
						this.selectors[vtypec].childNodes[0].childNodes[0].childNodes[e.target.choices.indexOf(e.target.value)].disabled = true;
					}
				} else if(e.target.prev !== '--' && e.target.value === '--'){
					for (var vtypec = 1; vtypec <= this.selectors.length - 1; ++vtypec) {
						this.selectors[vtypec].childNodes[0].childNodes[0].childNodes[e.target.choices.indexOf(e.target.prev)].disabled = false;
					}
					
				} else if (e.target.prev !== '--' && e.target.value !== '--') {
					for (var vtypec = 1; vtypec <= this.selectors.length - 1; ++vtypec) {
						this.selectors[vtypec].childNodes[0].childNodes[0].childNodes[e.target.choices.indexOf(e.target.prev)].disabled = false;
						this.selectors[vtypec].childNodes[0].childNodes[0].childNodes[e.target.choices.indexOf(e.target.value)].disabled = true;
					}
				}

				e.target.prev = e.target.value;
				if (typeof renderer.check_transversal === 'undefined') {
					this.editing = renderer.check_transversal; //user basis
				}
				else {
					this.editing = renderer.page; //program basis
				}

				this.validating = false;
				this.pure = true;
				if(dom_index < (e.target.choices.length-2)){
					let dom_length = renderer.dom_factor[dom_index].length;
					if (renderer.dom_factor[dom_index][dom_length-1] !== null) {
						this.validating = true;
						this.pure = false;
						renderer.swap_columns(this.editing, parseInt(e.target.id.split('select_all_selector_')[1]) + 1, dom_index + 1, this.pure, e.target[dom_index]);
					}
				} else{
					this.pure = true;
					renderer.swap_columns(this.editing, parseInt(e.target.id.split('select_all_selector_')[1]) + 1,'index', this.pure,'process');
					return null;
				}
			}
			catch (error) {
				console.error(error);
			}
		}

		//user structure => unbiased test possibilities
		for (var vtypec = 0; vtypec <= renderer.tableSize + 1; vtypec++) {
			let selectOption = document.createElement('option');
			try {
				if (renderer.tableSize === vtypec) { //applies for user test
					selectOption.value = '--';
					tdLabelSelector.choices.push('--');
					selectOption.innerHTML = 'Ignorar columna';
					tdLabelSelector.prev = '--';	
					tdLabelSelector.appendChild(selectOption);

				} else if (renderer.tableSize + 1 === vtypec) {
					selectOption.value = "Campo " + (vtypei + 1);
					tdLabelSelector.choices.push("Campo " + (vtypei + 1));
					selectOption.innerHTML = "Seleccionar campo " + (vtypei + 1);
					selectOption.defaultSelected = true;
					selectOption.disabled = true;
					selectOption.list_options = [];						
					tdLabelSelector.appendChild(selectOption);

				} else {
					if (vtypec < renderer.dom_factor.length) {
						selectOption.value = renderer.dom_factor[vtypec][renderer.dom_factor[vtypec].length - 1].key;
						tdLabelSelector.choices.push(renderer.dom_factor[vtypec][renderer.dom_factor[vtypec].length - 1].key);
						selectOption.innerHTML = renderer.dom_factor[vtypec][renderer.dom_factor[vtypec].length - 1].label;
						/* 					if (vtypei === vtypec) {
												tdLabelSelector.prev = renderer.dom_factor[vtypec][renderer.dom_factor[vtypec].length - 1].key;
											} */
						selectOption.trying = [];
						for (let index = 0; index < renderer.dom_factor[vtypec].length - 1; index++) {
							if (renderer.dom_factor[vtypec][index].critical !== false) {
								selectOption.trying.push(['critical', renderer.dom_factor[vtypec][index].error]);
							} else if (renderer.dom_factor[vtypec][index].unique !== false) {
								selectOption.trying.push(['unique', renderer.dom_factor[vtypec][index].error]);
							} else if (renderer.dom_factor[vtypec][index].re !== false) {
								selectOption.trying.push(['re', renderer.dom_factor[vtypec][index].error]);
								selectOption.re = renderer.dom_factor[vtypec][index].re;
								selectOption.list_options = renderer.dom_factor[vtypec][index].list;
							} else if (renderer.dom_factor[vtypec][index].logic.length !== 0) {
								selectOption.trying.push(['conditional', renderer.dom_factor[vtypec][index].error]);
								selectOption.logic = renderer.dom_factor[vtypec][index].logic;
							}

						}
						tdLabelSelector.appendChild(selectOption);
					} else {
						continue;
					}
	
				}
			}
			catch (error) {
				console.log(error);
			}
		};
		tdLabelShiftDiv.appendChild(tdLabelSelector);
		tdFieldSelector.appendChild(tdLabelShiftDiv);
		tdFieldSelector.id = 'selectortd_' + vtypei;
		if (Utils.findChildById(sheetFieldSelector, tdLabelSelector.id, true) !== null) {
			continue;
		}
		if (vtypei !== renderer.tableSize) {
			sheetFieldSelector.appendChild(tdFieldSelector);
		}
	}
	for (var s = 0; s < sheet1.length; s++) {
		document.getElementById('sheet_rows').appendChild(sheet1[s]);

	}
	document.getElementById('cencilio_file_name').innerHTML = renderer.file_name;
	//CONSENT BEFORE DATA STRUCTURE BEFORE VALIDITY	
	renderer.complete = true;
	renderer.set_virtual = false;
	return renderer.split_resp;

}
function renderFun(file){
	/*Función que toma la configuración del módulo como argumento
	y el nombre de archivo cargado mediante drag and drop para renderizar el documento.
	*/
	return new Promise(function(resolve,reject){
		renderer.excel_data = [];
		renderer.falsable_cells = [] //virtual structure that responds with an error
	
		try{
			  var reader = new FileReader();
			  let next_col = false;
			  reader.onloadend = function(e) {
				  var data = e.target.result;
				  data = new Uint8Array(data);
				  //process_wb(XLSX.read(data, {type: 'array'}));
				  /* read the file */  		
				  var workbook = XLSX.read(data, {type: 'array'}); // parse the file
				resolve(workbook);
	
			};		
			reader.onerror = function (e) {
				switch(e.target.error.code) {
				  case e.target.error.NOT_FOUND_ERR:
					console.info('File Not Found!');
					break;
				  case e.target.error.NOT_READABLE_ERR:
					console.info('File is not readable');
					break;
				  case e.target.error.ABORT_ERR:
					break; 
				  default:
					console.info('An error occurred reading this file.');
				};    			
			};
			reader.onprogress = function (e) {
				if (e.lengthComputable) {
				   var percentLoaded = Math.round((e.loaded / e.total) * 100);	
				}
			};
			reader.onabort = function (e) {
			  e.abort();
			};    		
			reader.onloadstart = function (e) {
			};    	  	
			  reader.readAsArrayBuffer(file);
		}
		catch (error){
			console.info(error);
			reject(error);
		}
	});
}
export default class renderWidget {
  constructor(file,config) {
		this.config = config;	
		this.cells = [];
		this.cells_names_selected = [];
		this.nselected = 0;
		this.sizeIncrement = 0;
		this.complete = false;
		this.page_shift = false;
		this.set_virtual = true;
		this.page_names = [];
		this.vals_unique = [];


		var xhr = new XMLHttpRequest();
		xhr.open('POST', 'https://app.cencilio.com/api/1.1/wf/account'); 	
		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Authorization", "Bearer dce1d75924fcda75937d1641e71ddada");
		xhr.setRequestHeader("Content-Type", "application/json");	
		xhr.send(`{"api_key":"${config['apiKey']}"}`);
		xhr.onload = function(data) {
			var json_resp = JSON.parse(data.currentTarget.response);
			
			if (xhr.readyState === 4 && xhr.status === 200) {
				config['theme'] = {
					global: {
					  backgroundColor: json_resp.response.theme.backgroundColor,
					  textColor: json_resp.response.theme.textColor,
					  primaryTextColor: json_resp.response.theme.btnTextColor,
					  primaryButtonColor: json_resp.response.theme.btnColor,
					  errorColor: json_resp.response.theme.errorColor
				}
				};
				config['fields'] = json_resp.response.schema.map(function (e) {
					let nObj =  {};
					let options = (typeof e.List_options !== 'undefined') ? e.List_options : [];
					nObj['label'] = e.Label;
					nObj['key'] = e.Key;
					nObj['validators'] = [];
					if(e.Duplicated){
						nObj['validators'].push({"validate":'unique', "error":e.ErrorMsg[1]});
					}
					if(e.Required){
						nObj['validators'].push({"validate":'required', "error":e.ErrorMsg[0]});
					}
					if(e.Regex !== undefined){
						nObj['validators'].push({"validate":'regex_match','regex':e.Regex,"list":options, "error":e.ErrorMsg[2]});
					}
					if(e.Conditional){
						nObj['validators'].push({"validate":'conditional','logics':e.Logics, "error":e.ErrorMsg[3]});
					}
					
					
					return nObj;
				})

				config['callback'] = {
					callback_url: json_resp.response.callback_url,
					callback_method: json_resp.response.callback_method,
					redirect_url: json_resp.response.redirect_url,
					callback_token_key: json_resp.response.token_key,
					callback_token_value: json_resp.response.token_value
				};
				dragger.style.backgroundColor = config['theme']['global']['backgroundColor'];
				dragger.style.color = config['theme']['global']['textColor']; 
				draggerForm.style = 'position: relative; width: 100%;height: 100%; text-align: center; outline-offset: -10px; outline: 2px dashed'+config['theme']['global']['primaryButtonColor']+';';
				draggerImg2.setAttribute('stroke', config['theme']['global']['primaryButtonColor']);
				draggerInputsContainer.style.display = 'block';

			} else if(xhr.status === 400 || xhr.status === 401 ){
				dragger.style.backgroundColor = '#F3F9FF';
				dragger.style.color = '#F97F7F'; 
				draggerForm.style = 'position: relative; width: 100%;height: 100%; text-align: center; outline-offset: -10px; outline: 2px dashed #F97F7F;';
				draggerInputsContainer.style.display = 'none';
				invalidKey.style.display = 'block';
			}

		}
		//Agregamos los scripts externos al body para renderizar el contenido del excel
		const script_xlsx = document.createElement("script");
		script_xlsx.src = "https://oss.sheetjs.com/sheetjs/xlsx.full.min.js";
		script_xlsx.async = true;
		const script_shim = document.createElement("script");
		script_shim.src = "https://oss.sheetjs.com/sheetjs/shim.js";
		script_shim.async = true;
		document.body.appendChild(script_xlsx);
		document.body.appendChild(script_shim);
		let tableStyle = document.createElement('style');
		tableStyle.innerHTML = `
		#sheet_div{
			overflow-x: hidden; 
			position: absolute;
			z-index: 1000;
			top: 50%;
			left: 50%;
			padding: 16px;
			width: 95%; 
			border-radius: 4px;
			height: 90%;
			overflow-y: scroll;
			-ms-transform: translate(-50%,-50%);
			transform: translate(-50%,-50%);
			border: 1px solid #DEDEDE;
			box-sizing: border-box;
			box-shadow: 0px 4px 88px rgba(0, 0, 0);
			display:block;
		  }
		  #header_xlsx{
			padding: 10px 0;
			height: 25%;
		  }
		  .cencilio_row{
			display: flex;
		  }
		  .cencilio-col{
			width: 50%; 
			position:relative;
		  }
		  .cencilio-col-30{
			width: 30%; 
			position:relative;
		  }
		  .cencilio-col-70{
			width: 70%; 
			position:relative;
		  }
		  #close_sheet, #filter_rows_btn{
			background-color: transparent;
			border: 0px;
			float: right;
		  }
		  #rows_counter_container{
			  display: inline;
		  }
		  #filters_rows_container{
			background: #FFFFFF;
			border: 1px solid #CFD8E5;
			box-sizing: border-box;
			box-shadow: 0px 5px 8px rgba(0, 0, 0, 0.2);
			border-radius: 6px;
			display: none;
			overflow: hidden;
			text-align: left;
			margin-top: 5px;
			margin-left: auto;
			margin-right: 0px;
			width: 200px;
			padding: 16px;
			position: relative;
			z-index: 1000;
		  }
		  #filter_rows_btn{
			  color: rgb(7, 40, 140);
			  margin-left: 25px;
		  }
		  #cencilio_file_name, #select_sheet_label{
			font-size: 16px;
		  }
		  #sheet_select{
			width: 136px; 
			border-radius: 6px;
			height: 32px; 
			display: inline-block; 
			margin: 0 10px;
			border: 1px solid #CFD8E5;
			color: #0A1833;
		  }
		  #cargar_btn_cencilio{
			height: 36px; 
			width: 122px; 
			border-width: 0px; 
			border-radius: 5px; 
			padding: 8px;  
			background-color: rgb(7, 40, 140); 
			color: #FFFFFF; 
			float: right;
		  }
		  #cencilio_title_instructions{
			font-weight: 700;
		  }
		  #cencilio_instructions{
			font-weight: 400;
		  }
		  #show_changed_label, #show_errors_label {
			font-size: 14px; 
			margin-right: 10px;
		  }
		  #page_table_container{
			height: 65%; 		
		  }
		  #page_table_row{
			height: 8%; 		
		  }
		  #page_table{
			overflow-x: scroll; 
			height: 92%; 
			overflow-y: scroll;
			width: 100%;
		  }
		  #page_table table{
			border-collapse:separate;
			border-spacing: 0; 
		  }
		  #sheetFieldSelector{
			height: 46px;
		  }
		  #sheetFieldSelector th{
			background: rgba(207, 216, 229, 0.7); 
			padding: 10px 12px;
			border: 0.5px solid #CFD8E5;
		  }
		  #sheetFieldSelector select{
			border-radius: 6px;
			color: #0A1833;
			background: none;
		  }
		  #sheetFieldSelector th:first-child{
			padding: 5px 30px 5px 14px;
			border-top-left-radius: 6px;
			border-collapse:separate
		  }
		  #sheetFieldSelector th:last-child{
			border-top-right-radius: 6px;
			border-collapse:separate
		  }
		  #sheet_rows tr:nth-child(even){
			background-color: rgba(54, 105, 177, 0.05);;
		  }
		  #sheet_rows tr:nth-child(even) input[type="text"]{
			background-color: rgba(54, 105, 177, 0.03);;
		  }
		  #sheet_rows tr td{
			border: 0.5px solid #CFD8E5;
		  }
		  #sheet_rows input[type="text"]{
		  border: transparent;
		  height: 34px;
		  }
		  #sheet_rows input:focus{
			outline:solid 1px #2A438C;
		  }
		  #sheet_rows tr td:first-child{
			padding: 0px 30px 0px 14px;
			position: relative;
		  }
		  #sheet_rows tr td:first-child label{
			position: absolute;
			margin-left: 5px;
		}
		.disabled_cencilio_row {
			opacity: 0.5;
		}

		  #footer_sheetdiv{
			 height:10%;
			 display: grid;
			 align-items: center;
		}

		 .modals_cencilio_style{
			display: none; 
			background-color:#FFFFFF;
			box-shadow: rgba(0, 0, 0, 0.2) 0px 0px 57px 0px;
			position: absolute;
			z-index: 1001;
			width: 450px; 
			height: 190px;
			border-radius: 6px; 
			top:50%; 
			left:50%; 
			*/-ms-transform: translate(-50%,-50%);
			transform: translate(-50%,-50%); 
			text-align:center; 
			padding:30px;
				
		}
		  .modals_title_cencilio_style{
			font-size: 18px; 
			font-weight: 600;
		   }

		   .modals_subtitle_cencilio_style{
			font-size: 14px; 
			font-weight: 300;
		   }

		  .modal_btns{
			height: auto; 
			width:50%;
			border-radius: 5px; 
			border-width:0; 
			font-size: 16px; 
			font-weight:600;  
			margin:30px; 
			padding: 10px 16px; 
		  }

		  #cancel_export_btn{
			background: #4968A6; 
			color: #FFFFFF;
		  }

		  #confirm_export_btn, #close_button, #find_replace_btn{
			background: #07288C; 
			color: #FFFFFF; 
		}

		  #progress_bar_wrp{
			width: 100%;
			height: 10px;
			background-color: #DDE7F2;
			border-radius: 20px;
			margin-top: 15px;
		}
		  #loadng_progress_bar_cencilio{
			height: 100%;
			width: 5%;
			background-color: #07288C;
			border-radius: 20px;
		}

		.tooltiptext {
			visibility: hidden; 
			width: 170px; 
			font-size: 12px; 
			background-color: #FFFFFF; 
			text-align: left; 
			line-height: 1.2;
			border-radius: 2px; 
			padding: 5px 5px; 
			position: absolute;
			z-index: 1001;
			bottom: -50%;
			left: 145%;
			margin-left: -75px;
			transition: opacity 0.3s;
			box-shadow: 3px 6px 29px 1px rgba(0,0,0,0.33);
			-webkit-box-shadow: 3px 6px 29px 1px rgba(0,0,0,0.33);
			-moz-box-shadow: 3px 6px 29px 1px rgba(0,0,0,0.33);
		}
		.tooltiptext::after {
			content: "";
			position: absolute;
			top: 50%;
			left: -4%;
			margin-left: -12px;
			border-width: 10px;
			border-style: solid;
			border-color: transparent #FFF transparent transparent;
		}
		.tooltiptext .tooltips_texts_container {
			color: red;
			border-bottom: 1px solid #5555553d;
			padding-bottom: 6px;
		}
		#sheet_rows td:last-child .tooltiptext{
			left: -57%;
		}
		#sheet_rows td:last-child .tooltiptext::after{
			left: 99%;
			border-color: transparent transparent transparent #FFF;
			margin-left: 1px;
		}

		.tooltiptext .tooltips_texts_container div::before{
			content: "•"; 
			color: red;
		}

		.tooltip_btn_replace_all {
			width: 100%; 
			border-width: 0px; 
			border-radius: 5px; 
			padding: 8px;  
			background-color: rgb(7, 40, 140); 
			color: #FFFFFF; 
			margin-top: 7px;
			cursor: pointer;
			text-align: center;
		}

		.static-value-list{
			z-index: 1001;
			position: absolute;
			background-color: white;
			max-height: 150px;
			overflow-y: auto;
		}

		.static-value-list ul{
			padding: 0 7px;
			margin: 10px 0;
		}

		.static-value-list li{
			align-items: center;
			cursor: pointer;
			display: flex;
			border-bottom: solid 1px #f2f2f2;
			padding:  3px;
		}
		.find_replace_input_cencilio{
			width: 100%;
			margin-top: 20px;
			border:1px solid;
		}

		.static-value-list li:hover{
			background-color: #f2f2f2;
		}
		.button-loading-cencilio::after {
			content: "";
			position: absolute;
			width: 16px;
			height: 16px;
			border: 3px solid transparent;
			border-top-color: #ffffff;
			border-radius: 50%;
			animation: button-loading-spinner 1s ease infinite;
		}
		.spinner-loading-cencilio::after {
			content: "";
			position: absolute;
			width: 16px;
			height: 16px;
			border: 3px solid transparent;
			border-top-color: rgb(7, 40, 140);
			border-radius: 50%;
			animation: button-loading-spinner 1s ease infinite;
		}
		@keyframes button-loading-spinner {
			from {
				transform: rotate(0turn);
			}
			to {
				transform: rotate(1turn);
			}
		}
		

		`;
		document.head.appendChild(tableStyle);
		let invalidKey = document.createElement('div');
		invalidKey.id = 'api_error';
		invalidKey.style = 'position: relative; top: 50%; transform: translateY(-50%); display: none;';
		invalidKey.innerHTML = 'Error de credenciales: valida tu API key en app.cencilio.com';
		
		let dragger = document.getElementById('cencilio-importer');	
		dragger.className = 'dragger';
		dragger.style.width = '100%';
		dragger.style.height = '220px'; 

		dragger.draggable = true;
		dragger.ondragstart = function (event) {
    	event.dataTransfer.setData('application/vnd.ms-excel', null);
		}
		dragger.ondragover = function(event) {
  			event.preventDefault();
		};
		dragger.ondrop = function(ev) {
			ev.preventDefault();
			document.getElementById('draggerInputsContainer').style.display = 'none';
			document.getElementById('spinner').style.display = 'block';
			var file = (ev.dataTransfer.items) ? ev.dataTransfer.items[0].getAsFile() : ev.dataTransfer.files[0];
			renderer.file = file;
			renderer.file_name = file.name;
			renderFun(file).then(resolve => {
				setTimeout(() => {
					table_maker(config, resolve);
				}, 500);
			});  
			
		};
		let draggerForm = document.createElement('form');	
		draggerForm.className = 'pimg';
		draggerForm.id = 'pimg';
		draggerForm.enctype = 'multipart/form-data';
		let draggerInputsContainer = document.createElement('div');
		draggerInputsContainer.id= 'draggerInputsContainer';
		draggerInputsContainer.style = 'position: relative; top: 50%; transform: translateY(-50%);display:none;';

		let draggerImg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		let iconPath = document.createElementNS('http://www.w3.org/2000/svg','path');
		draggerImg2.setAttribute('fill', 'none');
		draggerImg2.setAttribute('viewBox', '0 0 24 24');
		draggerImg2.setAttribute('width', '100%');
		draggerImg2.setAttribute('height', '40px');
		draggerImg2.classList.add('post-icon');
		draggerImg2.id = 'dragger-icon';
		iconPath.setAttribute(
		  'd',
		  'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
		);
		iconPath.setAttribute(
			'stroke-linecap',
			'round'
		  );
		iconPath.setAttribute(
		'stroke-linejoin',
		'round'
		);	
		iconPath.setAttribute(
			'stroke-width',
			'1.8'
			);	
		draggerImg2.appendChild(iconPath);
		draggerInputsContainer.appendChild(draggerImg2);
		let draggerInput = document.createElement('input');	
		draggerInput.type = 'file';
		draggerInput.id = 'pIn';
		draggerInput.accept = '.xlsx, .xls, .csv';
		draggerInput.style='opacity: 0; position: absolute;';
		draggerInput.hidden = true;
		draggerInputsContainer.appendChild(draggerInput);
		//process data in file
		draggerInput.onchange = function (e) { 
			document.getElementById('draggerInputsContainer').style.display = 'none';
			document.getElementById('spinner').classList.add("spinner-loading-cencilio");
			document.getElementById('spinner').style.display = 'block'; //spinner-loading-cencilio
			renderer.file_name = this.files[0].name;
			renderFun(this.files[0]).then(resolve =>{
				setTimeout(() => {
					table_maker(config, resolve);
				}, 500);
				
			});  
		};
		draggerForm.addEventListener("click", () =>	{
			draggerInput.click();
		});
		let draggerLabel = document.createElement('label');	
		draggerLabel.appendChild(document.createTextNode("Arrastra tu archivo aquí o haz click para cargar"));
		draggerLabel.htmlFor='pIn';
		draggerLabel.class='perfil_label';
		draggerLabel.id='importer-msg';
		draggerLabel.style = 'margin-top: 10px; cursor: pointer; font-weight:500; width:100%;';
		draggerInputsContainer.appendChild(draggerLabel);	
		let draggerSubLabel = document.createElement('p');
		draggerSubLabel.innerHTML = 'Formatos permitidos CSV, XLSX, XLS' ;
		draggerSubLabel.style = 'font-size: 12px; font-weight:300;';
		draggerInputsContainer.appendChild(draggerSubLabel);
		let excelButton = document.createElement('button'); 			
		excelButton.id = 'ppbutton'; 		
		excelButton.style = 'display:none;'; 
		let draggerSpinner = document.createElement('div');
		draggerSpinner.appendChild(document.createTextNode("Cargando..."));
		draggerSpinner.id = 'spinner';	
		draggerSpinner.style = 'position: relative; top: 50%; transform: translateY(-50%); display: none;';
		draggerInputsContainer.appendChild(excelButton);
		draggerForm.appendChild(draggerSpinner);
		draggerForm.appendChild(draggerInputsContainer);	
		draggerForm.appendChild(invalidKey);
		dragger.appendChild(draggerForm);
		let exportConfirmationDiv = document.createElement('div');
		exportConfirmationDiv.id = 'export_confirmation_cencilio';
		exportConfirmationDiv.className = 'modals_cencilio_style';

		let exportConfirmationTitle = document.createElement('p');
		exportConfirmationTitle.className = 'modals_title_cencilio_style';
		exportConfirmationTitle.innerHTML = '¿Estás seguro de cargar tus datos?';
		let exportConfirmationSubtitle = document.createElement('p');
		exportConfirmationSubtitle.className = 'modals_subtitle_cencilio_style';
		exportConfirmationSubtitle.innerHTML = 'Una vez cargados tus datos no podrán ser editados.';
		let exportConfirmationBtnsDiv = document.createElement('div');
		exportConfirmationBtnsDiv.id = 'export_confirmation_btns_div';
		exportConfirmationBtnsDiv.style = 'display: flex;';
		let cancelExportBtn = document.createElement('button');
		cancelExportBtn.id = 'cancel_export_btn';
		cancelExportBtn.className = 'modal_btns';
		cancelExportBtn.type='button'; 
		cancelExportBtn.innerHTML = 'CANCELAR';
		cancelExportBtn.onclick = function (e){
		document.getElementById('export_confirmation_cencilio').style.display = 'none';
		renderer.set_virtual = true;	
		}
		let confirmExportBtn = document.createElement('button');
		confirmExportBtn.id = 'confirm_export_btn';
		confirmExportBtn.className = 'modal_btns';
		confirmExportBtn.type='button'; 
		confirmExportBtn.innerHTML = 'CARGAR';
		confirmExportBtn.onclick = send_data_processed;

		let exportWarningDiv = document.createElement('div');
		exportWarningDiv.id = 'export_warning_cencilio';
		exportWarningDiv.className = 'modals_cencilio_style';

		let exportWarningTitle = document.createElement('p');
		exportWarningTitle.className = 'modals_title_cencilio_style';
		exportWarningTitle.innerHTML = 'No se pueden cargar los datos';

		let exportWarningSubtitle = document.createElement('p');
		exportWarningSubtitle.className = 'modals_subtitle_cencilio_style';
		exportWarningSubtitle.id = 'modals_subtitle_cencilio_text';
		
		let exportWarningBtnsDiv = document.createElement('div');
		exportWarningBtnsDiv.id = 'export_warning_btns_div';
		exportWarningBtnsDiv.style = 'display: flex;';

		let dataWarningClose = document.createElement('button');
		dataWarningClose.type='button';
		dataWarningClose.className = 'modal_btns'; 
		dataWarningClose.style = 'width: 100%;'; 
		dataWarningClose.innerHTML = 'CERRAR';
		dataWarningClose.onclick = function (e){
		document.getElementById('export_warning_cencilio').style.display = 'none';	
		}

		exportConfirmationBtnsDiv.appendChild(cancelExportBtn);
		exportConfirmationBtnsDiv.appendChild(confirmExportBtn);
		exportConfirmationDiv.appendChild(exportConfirmationTitle);
		exportConfirmationDiv.appendChild(exportConfirmationSubtitle);
		exportConfirmationDiv.appendChild(exportConfirmationBtnsDiv);
		exportWarningBtnsDiv.appendChild(dataWarningClose);
		exportWarningDiv.appendChild(exportWarningTitle);
		exportWarningDiv.appendChild(exportWarningSubtitle);
		exportWarningDiv.appendChild(exportWarningBtnsDiv);
		document.body.appendChild(exportConfirmationDiv);
		document.body.appendChild(exportWarningDiv);

		let loadingDataDiv = document.createElement('div');
		loadingDataDiv.id = 'loading_data_cencilio';
		loadingDataDiv.className = 'modals_cencilio_style';
		
		
		let loadingDataTitle = document.createElement('p');
		loadingDataTitle.className = 'modals_title_cencilio_style';
		loadingDataTitle.innerHTML = 'Cargando datos...';
		let loadingDataSubtitle = document.createElement('p');
		loadingDataSubtitle.style = 'font-size: 14px; display:block; font-weight: 300; color: #07288C';
		loadingDataSubtitle.id = 'loading_subtitle_cencilio';
		let progressBarWrapper = document.createElement('div');
		progressBarWrapper.id = 'progress_bar_wrp';
		let loadingProgressBar = document.createElement('div');
		loadingProgressBar.id = 'loadng_progress_bar_cencilio';
		loadingDataDiv.appendChild(loadingDataTitle);
		loadingDataDiv.appendChild(loadingDataSubtitle);
		loadingDataDiv.appendChild(progressBarWrapper);
		progressBarWrapper.appendChild(loadingProgressBar);
		document.body.appendChild(loadingDataDiv);
		let dataExportDiv = document.createElement('div');
		dataExportDiv.id = 'data_exported';
		dataExportDiv.className = 'modals_cencilio_style';
		let dataExportSpan = document.createElement('span');
		dataExportSpan.className = 'modals_title_cencilio_style';
		dataExportSpan.innerHTML = '¡Datos cargados exitosamente!';


		let dataExportAccept = document.createElement('button');
		dataExportAccept.id = 'close_button';
		dataExportAccept.type='button';
		dataExportAccept.className = 'modal_btns'; 
		dataExportAccept.innerHTML = 'ACEPTAR';
		dataExportAccept.onclick = data_exported;

		dataExportDiv.appendChild(dataExportSpan);	
		dataExportDiv.appendChild(dataExportAccept);
		document.body.appendChild(dataExportDiv);				
			
  }
	tdCombined(event) {
		//solve passive trigger on active element
		if (event.target){
			renderer.cells_names_selected.push(event.target); 		
  			event.target.style.backgroundColor = 'white';
			  if (renderer.hasOwnProperty('check_transversal')){
				this.editing = renderer.check_transversal; //user basis
			}
			else{
				this.editing = renderer.page; //program basis
			}
				renderer.cells_names_selected = [];
		}
		return null;
	}

	swap_columns(Page, a, b, pure,process) {
		//DATA STRUCTURE OF SWAPPED COLUMNS
		if (renderer.hasOwnProperty('check_transversal')) {
			this.editing = renderer.check_transversal; //user basis
		}
		else {
			this.editing = renderer.page; //program basis
		}
		Page = this.editing;
		let a_idx = [];
		//let b_idx= [];		
		this.col = 1;
		//first we get child node
		//swapping with a pure argument	
		this.a = a;
		for (var row = 0; row < renderer.excel_data[Page].length; row++) {
			let row_vals = document.getElementById('page_table').childNodes[0].childNodes[1].childNodes[row];
			
			if (pure === false) {
				//test all values to see which can be corrected
				try {
					let dom_length = renderer.dom_factor[b-1].length;
					//given regexp cannot be accessed from the index
					if (renderer.dom_factor[b - 1][dom_length-1].re !== false) {
								// actualizar trying de los td en la columna con base a select seleccionado - aplicar/usar row_vals.childNodes[a].childNodes[0]
						this.ground_truth = renderer.prove(row_vals.childNodes[a].childNodes[0], a - 1, row, Page, row_vals.childNodes[a].childNodes[0].value,process.trying, renderer.dom_factor[b - 1][0].error, false, true, process.re,process.logic); //wants to exchange processes with a different regexp			
					}
					else {
						this.ground_truth = renderer.prove(row_vals.childNodes[a].childNodes[0], a - 1, row, Page, row_vals.childNodes[a].childNodes[0].value, process.trying, renderer.dom_factor[b - 1][0].error, false, false, process.re,process.logic); //wants to exchange processeS row_vals.childNodes[a].childNodes[0]
					}
					//FINDS A TRAVERSED NODE
					if (row_vals.childNodes[a].childNodes[0].isinvalid === true) {

						if (this.ground_truth !== false) {
							//value passes process
							row_vals.childNodes[a].childNodes[0].isinvalid = false;
							//value can be erroneous
							row_vals.childNodes[a].childNodes[0].falsable = false;
							//information in cell has changed
							row_vals.childNodes[a].childNodes[0].isnewinfo = true;
							row_vals.childNodes[a].childNodes[0].style.backgroundColor = 'white';
						}
						else {
							row_vals.childNodes[a].childNodes[0].err_msg = renderer.dom_factor[b - 1][0].error;
						}
					}
					else if (row_vals.childNodes[a].childNodes[0].isinvalid === false) { //ONE CAN BE INVALID AFTER TRANSFER
						//row_vals.childNodes[a].childNodes[0].err_msg = this.dom_factor[b - 1][0].error; //error must be shown after choosing
						if (this.ground_truth !== true) {
							row_vals.childNodes[a].childNodes[0].isinvalid = true;
							row_vals.childNodes[a].childNodes[0].isedited = true;
							//ALL EMPTY ROWS SHOULD CONTAIN AN ERROR
							row_vals.childNodes[a].childNodes[0].falsable = true;
						}
					}
					else if (row_vals.childNodes[a].childNodes[0].isinvalid === true) {
						if (row_vals.childNodes[b].childNodes[0].isinvalid === false) {
							row_vals.childNodes[a].childNodes[0].falsable = false;
						}
					}
					//CHANGE PROOF AND DTYPE
				}
				catch (error) {
					renderer.vals_unique = []; //Reset to avoid duplicates in array
					console.error(error);
				}
			} 
			else {
				//clean selected cell in row  
				this.purify(row_vals.childNodes[a].childNodes[0], a - 1, row_vals.childNodes[a].childNodes[0].row, Page);
			}

			if((row+1) === renderer.excel_data[Page].length){
				renderer.vals_unique = [];

			}
		}
	}	
	render_invalid_page(state) {
  		let rows = document.getElementById('sheet_rows').childNodes;
  		this.skip_bad_row = false;
  		this.row = 0;
  		for (var i = 0; i < rows.length; i++) {
  			try{
  				document.getElementById('render_row_'+String(i)).incoming = 'show_errors';
  				if (this.skip_bad_row === false){
  					//continous loop
					this.render_invalid(state,rows[i]); 
				}
  				else{
  					//get the last row
  					this.render_invalid(state,rows[i - this.row]);
					if (i >= (rows.length - this.row)){
						this.render_invalid(state,rows[i]);	//show all the remaining false values at recursion				
					}
				}
			}
			catch (error){
				//the id of an element was skipped due to data structure violations
				this.skip_bad_row = true; 
				this.row += 1;
			}
		}			
	}	
	render_invalid(state,row) {
		if (state === true){
			for (var r = 0; r < document.getElementById('sheet_rows').childNodes.length; r++) {
				let grandchildren = document.getElementById('sheet_rows').childNodes[r];
  				for (var k = 0; k < grandchildren.childNodes.length; k++) {
					//console.info('ITERATING CELL',grandchildren.childNodes[k].childNodes[0]);  
  					if (grandchildren.childNodes[k].childNodes[0].type === 'checkbox'){
						continue;  					
  					}
  					else if (grandchildren.childNodes[k].childNodes[0].type !== 'text'){
						continue;  					
  					}					
  					//intensify error
					if (grandchildren.childNodes[k].childNodes[0].isinvalid === true){
						grandchildren.childNodes[k].childNodes[0].style.backgroundColor = 'rgb(201 41 41 / 92%)';
       				if (typeof grandchildren.childNodes[k].childNodes[1] === 'undefined'){
							//El mensaje es dado en un evento o manejado por el elemento que contiene la verificacion		
							//console.info('ERROR', renderer.dom_factor[k-1][0][0].error, 'AT COLUMN',k);
							this.addTooltip(grandchildren.childNodes[k], renderer.dom_factor[k-1][0][0].error);	 	  					
   	 				}
					}  
				}
			}				
		}
		else{
			for (var r = 0; r < document.getElementById('sheet_rows').childNodes.length; r++) {
				let grandchildren = document.getElementById('sheet_rows').childNodes[r];
  				for (var k = 0; k < grandchildren.childNodes.length; k++) {
  					//milden error	
  					console.info(grandchildren.childNodes[k].childNodes[0]);
					if (grandchildren.childNodes[k].childNodes[0].isinvalid === true){
						grandchildren.childNodes[k].childNodes[0].style.backgroundColor = this.errorColor;
					}  				
				}
			}				
		}
	}		
	allNull(cell) {
  		return cell === null;
	}	
	render_edited_page(state) {
  		let rows = document.getElementById('sheet_rows').childNodes;
  		this.skip_bad_row = false;
  		this.row = 0;
  		for (var i = 0; i < rows.length; i++) {
  			try{
  				document.getElementById('render_row_'+String(i)).incoming = 'show_changed';
  				if (this.skip_bad_row === false){
  					//continous loop
					this.render_edited(state,rows[i]); 
				}
  				else{
  					//get the last row
  					this.render_edited(state,rows[i - this.row]);
					if (i >= (rows.length - this.row)){
						this.render_edited(state,rows[i]);	//show all the remaining edited at recursion				
					}
				}
			}
			catch (error){
				//the id of an element was skipped due to data structure violations
				this.skip_bad_row = true; 
				this.row += 1;
			}
		}					
	}	
	render_edited(state,row) {	
		if (state === true){
			let children = row.childNodes;
  			for (var j = 0; j < children.length; j++) {
  				let grandchildren = children[j].childNodes;
  				for (var k = 0; k < grandchildren.length; k++) {
					if (grandchildren[k].isnewinfo === true){
						console.info(grandchildren[k].style.backgroundColor);
						grandchildren[k].style.backgroundColor = 'rgb(0 0 0 / 26%)';	
						console.info(grandchildren[k].style.backgroundColor);
					}  
				}
			}			
		}
		else{
			let children = row.childNodes;
  			for (var j = 0; j < children.length; j++) {
  				let grandchildren = children[j].childNodes;
  				for (var l = 0; l < grandchildren.length; l++){
					console.info('ITERATING EDITED CELL');
					if (grandchildren[l].isnewinfo === true){
						grandchildren[l].style.backgroundColor = 'white';
						if (grandchildren[l].isinvalid !== true){
							grandchildren[l].style.backgroundColor = 'white';
						}
						else{
							grandchildren[l].style.backgroundColor = renderer.config['theme']['global']['errorColor'];
						}
					}
				} 					
			}				
		}
	}
	addTooltip(k, msg){
		/*  
			Una funcion que crea un tooltip con un mensaje y lo anexa con su pariente contenedor 	
			Argumentos:
				- k: contenedor pariente de tooltip
				- msg: mensaje para mostrar	
		*/
		if(k.childNodes.length === 1 ){
			var tooltipWrapper = document.createElement('div');
			tooltipWrapper.className = "tooltiptext";									
			k.appendChild(tooltipWrapper);
		} else if(k.childNodes.length > 1) {
			var tooltipWrapper = k.childNodes[1];
			while (tooltipWrapper.firstChild) {
				tooltipWrapper.removeChild(tooltipWrapper.firstChild);
			}
		}
		
		let tooltip_texts_container = document.createElement('div');
		tooltip_texts_container.className = "tooltips_texts_container";

		for (var index = 0; index < msg.length; index++) {
			var node = document.createElement("div");
			var textnode = document.createTextNode(msg[index]);
			node.appendChild(textnode);
			tooltip_texts_container.appendChild(node);
		}

		let tooltip_btns_container = document.createElement('div');
		tooltip_btns_container.className = "tooltips_btns_container";

		let tooltip_btn_replace_all = document.createElement('div');
		tooltip_btn_replace_all.className = "tooltip_btn_replace_all";
		tooltip_btn_replace_all.innerText = "Corregir varias veces";
		tooltip_btn_replace_all.addEventListener("click", ()=>{
			findReplaceModal(k.childNodes[0].value, k.childNodes[0].col);
		});

		tooltipWrapper.appendChild(tooltip_texts_container);
		tooltip_btns_container.appendChild(tooltip_btn_replace_all);
		tooltipWrapper.appendChild(tooltip_btns_container);
		


	   k.onmouseenter = function(e){
			/* Normalmente utilizamos hover de CSS para estilizar elementos en los que esta el cursor pero en este caso necesitamos usar onmouseenter */
			//Buscamos la celda que guarda propiedades para controlar la vista del mensaje
			//Un elemento que guarda informacion falsa guarda un estado positivo de falsabilidad
			//Si el dato se falsifica su valor no es valido
			//Usamos la propiedad de visibilidad para saber si el elemento con la informacion falsa expone su error
			if (e.target.childNodes[0].falsable === true){
				e.target.childNodes[1].style.visibility = 'visible';
			}	        	  					
			else if (e.target.childNodes[0].falsable === false){ 	
				//Si el elemento se controla validamente no se puede demostrar su falsedad por lo tanto no se expone la burbuja
				e.target.childNodes[1].style.visibility =  'hidden';
			}
	   };
	   k.onmouseleave = function(e){
			//Si el error esta expuesto necesitamos controlar la visibilidad temporalmente para seguir cambiando los datos
			e.target.childNodes[1].style.visibility =  'hidden';
		};
		return k;
	}

	//Renderizados de tabla (celdas)
	loadTable(idx) {
		let ipage = renderer.excel_data[idx];
		let cells_sum = 0;
		let errors_sum = 0;
		this.trs = [];
		renderer.old = renderer.page;
		renderer.page = idx;
		document.getElementById('spinner').style.display = 'none';
		document.getElementById('draggerInputsContainer').style.display = 'block';
		let cells_len = [];
		for (var cells = 0; cells < ipage.length; cells++) {
			cells_len.push(ipage[cells].length);
		}
		let complete_size = Math.max(...cells_len); //traverse based on maximum number of items in row
		if (renderer.dom_factor.length < complete_size) {
			this.tableSize = complete_size; //doc based
		}
		else if (complete_size < renderer.dom_factor.length) {
			this.tableSize = renderer.dom_factor.length; //user based
		}
		else {
			this.tableSize = complete_size; //property based
		}
		this.abstract_c = complete_size; //add one for --
		for (var R = 0; R < ipage.length; R++) {
			//renderer.deep_excel_data[prow][shape].push(null);
			if (ipage[R].every(this.allNull) === true) {
				continue;
			}
			let trDiv = document.createElement('tr');
			let tdDiv = document.createElement('td');
			let checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.id = 'render_row_' + String(R);
			checkbox.checked = true;

			let checkboxLabel = document.createElement('label');
			checkboxLabel.htmlFor = 'render_row_' + String(R);
			checkboxLabel.appendChild(document.createTextNode(R + 1));
			tdDiv.appendChild(checkbox);
			tdDiv.appendChild(checkboxLabel);
			trDiv.appendChild(tdDiv);
			//accept or reject row for storage
			checkbox.onchange = function (e) {
				if (e.target.checked === true) {
					e.target.discarded = false;
					e.target.parentElement.parentElement.className = "enabled_cencilio_row";
				}
				else {
					e.target.discarded = true;
					e.target.parentElement.parentElement.className = "disabled_cencilio_row";
				}
			};

			renderer.sizeIncrement += 32;
			//falsability similar to shape and content in table
			for (var prow = 0; prow < renderer.falsable_cells.length; prow++) {
				for (var shape = 0; shape < renderer.falsable_cells[prow].length; shape++) {
					for (var Size = 0; Size < this.tableSize; Size++) {
						if (typeof renderer.falsable_cells[prow][shape][Size] === 'undefined') {
							renderer.falsable_cells[prow][shape][Size] = false;
						}
						if (typeof renderer.excel_data[prow][shape][Size] === 'undefined') {
							try {
								renderer.excel_data[prow][shape].push(null);
							}
							catch (error) {
							}
						}
					}
				}
			}
			//Data in page is independent of the table
			for (var C = 0; C < this.tableSize; C++) {
				let v = ipage[R][C];
				try {
					//if not, prepare context to show virtual information
					if (this.set_virtual === true) {
						this.textbox = document.createElement('input');
						this.textbox.type = 'text';
						this.textbox.col = C;
						this.textbox.row = R;
						this.textbox.value = (v === null) ? "" : v;
						this.textbox.selecting = false;
						this.textbox.trying = [];
						this.textbox.err_msg = [];
						cells_sum += 1;

						this.textbox.onfocus = function (e) {
							
							renderer.tdCombined(e);
							document.querySelectorAll(".static-value-list").forEach(el => el.remove());
							let select_target = document.getElementById('select_all_selector_'+e.target.col);
							let value_index = select_target.choices.indexOf(select_target.value);
							if(select_target[value_index].list_options.length > 0){
								let parent = document.getElementById('page_table');
								addSelectList(e.target.parentNode,parent,select_target[value_index].list_options,e.target);
							} 
							if (renderer.hasOwnProperty('check_transversal')) {
								this.editing = renderer.check_transversal;
							}
							else {
								this.editing = renderer.page;
							}
						}

						this.textbox.onblur = function (e) {
							e.target.isnewinfo = true; //acknowledge the value is changed
							e.target.isedited = true;
							let select_target = document.getElementById('select_all_selector_'+e.target.col);
							let value_index = select_target.choices.indexOf(select_target.value);
							if(value_index >= 0 && value_index<(select_target.choices.length-1)){ //validate if the field's map is done
								renderer.prove(e.target, e.target.col, e.target.row, this.editing, e.target.value, select_target[value_index].trying, e.target.err_msg, false, false,select_target[value_index].re,select_target[value_index].logic);
							}else{
								renderer.prove(e.target, e.target.col, e.target.row, this.editing, e.target.value, e.target.trying, e.target.err_msg, false, false,e.target.re,e.target.logic);
							}
							if (renderer.hasOwnProperty('check_transversal')) {
								this.editing = renderer.check_transversal; //user basis
							}
							else {
								this.editing = renderer.page; //program basis
							}
							e.target.isedited = false; // undestand why is falsed afte prove() function
							renderer.excel_data[this.editing][e.target.row][e.target.col] = e.target.value;
							renderer.deep_excel_data[this.editing][e.target.row][e.target.col] = e.target.value;

							if (e.target.isinvalid === true) {
								e.target.style.backgroundColor = renderer.config['theme']['global']['errorColor'];
							}
						}

						let tdDiv = document.createElement('td');
						tdDiv.appendChild(this.textbox);
						trDiv.appendChild(tdDiv);

						if (typeof renderer.dom_factor[C] !== 'undefined') { //user validates
							// ==> Condition for validators critial, unique, regex and empty
							for (let val = 0; val < (renderer.dom_factor[C].length -1); val++) {
								if (renderer.dom_factor[C][val].critical !== false) {
									this.textbox.critical = 1;
									this.textbox.readOnly = false;
									this.textbox.trying.push(['critical',renderer.dom_factor[C][val].error]);

									if (v === '') {
										errorCell(this.textbox); //coloriza campo crítico vacío
										this.textbox.isinvalid = true;
										this.textbox.falsable = true;
										renderer.falsable_cells[idx][R][C] = true;
										errors_sum += 1;
										this.textbox.err_msg.push(renderer.dom_factor[C][val].error);
										trDiv.bad_row = true;
									}
									else {
										this.textbox.isinvalid = false;
										this.textbox.falsable = false;
									}
								}
								else if (renderer.dom_factor[C][val].unique !== false) {
									this.textbox.readOnly = false;
									this.textbox.unique = 1;
									this.textbox.trying.push(['unique',renderer.dom_factor[C][val].error]);


									if (renderer.dom_factor[C][val].childs.includes(v)) {
										this.textbox.isinvalid = true;
										this.textbox.falsable = true;
										renderer.falsable_cells[idx][R][C] = true;
										errorCell(this.textbox); //coloriza campo contenido duplicado   
										errors_sum += 1;
										this.textbox.err_msg.push(renderer.dom_factor[C][val].error);
										trDiv.bad_row = true;
									}
									else {
										this.textbox.isinvalid = false;
										this.textbox.falsable = false;
										renderer.dom_factor[C][val].childs.push(ipage[R][C]);
										//renderer.vals_unique.push(ipage[R][C]); Array with unique values
									}
								}
								else if (renderer.dom_factor[C][val].re !== false) {
									this.textbox.readOnly = false;
									this.textbox.re = renderer.dom_factor[C][val].re;
									this.textbox.trying.push(['re',renderer.dom_factor[C][val].error]);
									this.textbox.list_options = renderer.dom_factor[C][val].list;
									//create table container

									if (v === null) { //unlikely to happen due to previous condition
										this.matching = null; //null is not a regexp           			
									}
									else {
										this.matching = v.match(new RegExp(renderer.dom_factor[C][val].re));
									}

									if (this.matching === null || this.matching.length === null) {
										errorCell(this.textbox); //coloriza campo con re   
										errors_sum += 1;
										this.textbox.err_msg.push(renderer.dom_factor[C][val].error);
										this.textbox.isinvalid = true;
										renderer.falsable_cells[idx][R][C] = true;
										this.textbox.falsable = true;
									}
									else {
										this.textbox.isinvalid = false;
										renderer.falsable_cells[idx][R][C] = false;
									}
									trDiv.bad_row = true;
								} else if(renderer.dom_factor[C][val].logic.length !== 0){
									this.textbox.readOnly = false;
									this.textbox.trying.push(['conditional',renderer.dom_factor[C][val].error]);
									this.textbox.logic = renderer.dom_factor[C][val].logic;
									//Validar logic for input
									let col_validate = renderer.dom_factor.findIndex (dm => dm.some(k => k.key === renderer.dom_factor[C][val].logic[0]));
									let cell_a_value = ipage[R][col_validate];
									let cond_a_result = conditionalValidation(renderer.dom_factor[C][val].logic[1],cell_a_value, renderer.dom_factor[C][val].logic[2]);
									let cond_b_result = conditionalValidation(renderer.dom_factor[C][val].logic[3], v, renderer.dom_factor[C][val].logic[4]);
									
									if (cond_a_result) {
										if (cond_a_result && cond_b_result) {
											this.textbox.isinvalid = false;
											renderer.falsable_cells[idx][R][C] = false;
										} else {
											errorCell(this.textbox); //coloriza campo con re   
											errors_sum += 1;
											this.textbox.err_msg.push(renderer.dom_factor[C][val].error);
											this.textbox.isinvalid = true;
											renderer.falsable_cells[idx][R][C] = true;
											this.textbox.falsable = true;
										}
									} else {
										this.textbox.isinvalid = false;
										renderer.falsable_cells[idx][R][C] = false;
									}



								} else {
									//LABEL SET WITHOUT VALIDATION
									this.textbox.trying.push(null);
									this.textbox.err_msg.push('');
									this.textbox.isinvalid = false;
									this.textbox.falsable = false;
									continue;
								}
							}
							if(this.textbox.err_msg.length > 0){
								this.tdDiv = this.addTooltip(tdDiv, this.textbox.err_msg);
							}	
						}
						else {
							//COLUMN NAME IS IN FIRST ROW
							this.textbox.trying.push(null);
							this.textbox.err_msg.push('');
							this.textbox.isinvalid = false;
							this.textbox.falsable = false;
							continue;
						}
					}
					else { //user shows another page
						//Data in page depends on element focus
						//Is it possible to exclude validators from nest to avoid proof overriding 
						if (this.page_shift === false) {
							this.edits = [];
							let edition_errors = 0;
							for (var page_row = 0; page_row < document.getElementById('sheet_rows').childNodes.length; page_row++) {
								let page_td = document.getElementById('sheet_rows').childNodes[page_row];
								this.edits.push([]);
								for (var page_col = 1; page_col < page_td.childNodes.length + 1; page_col++) { //seek cells
									try {
										this.old_transversal = renderer.prev_exp;	//previous action
										this.check_transversal = idx;	//new action						
										//set invalid attribute using the attribute with error	
										if (renderer.falsable_cells[this.check_transversal][page_row][page_col - 1] === true) { //traversed value in field must be invalid
											//demonstrating info is false after showing real info
											if (renderer.falsable_cells[this.old_transversal][page_row][page_col - 1] === false) {
												page_td.childNodes[page_col].childNodes[0].value = ipage[page_row][page_col - 1];
												renderer.prove(page_td.childNodes[page_col].childNodes[0], page_td.childNodes[page_col].childNodes[0].col, page_td.childNodes[page_col].childNodes[0].row, this.check_transversal, false, true, page_td.childNodes[page_col].childNodes[0].err_msg, false, true);
												edition_errors += 1;	 //avoid confused deletion after proving error  
												cells_sum += 1;
											}
											else if (renderer.falsable_cells[this.old_transversal][page_row][page_col - 1] === null) { //demonstrating info is false after showing unknown info
												page_td.childNodes[page_col].childNodes[0].value = ipage[page_row][page_col - 1];
												renderer.prove(page_td.childNodes[page_col].childNodes[0], page_td.childNodes[page_col].childNodes[0].col, page_td.childNodes[page_col].childNodes[0].row, this.check_transversal, false, true, page_td.childNodes[page_col].childNodes[0].err_msg, false, true);
												edition_errors += 1;	 //avoid confused deletion after proof
												cells_sum += 1;
											}
											else {
												//										
											}
										}
										else if (renderer.falsable_cells[this.check_transversal][page_row][page_col - 1] === false) { //MOST LIKELY TO HAPPEN
											//demonstrating true info after exposing false info (this must be corrected afterwards)
											if (renderer.falsable_cells[this.old_transversal][page_row][page_col - 1] === true) {
												page_td.childNodes[page_col].childNodes[0].value = ipage[page_row][page_col - 1];
												renderer.prove(page_td.childNodes[page_col].childNodes[0], page_td.childNodes[page_col].childNodes[0].col, page_td.childNodes[page_col].childNodes[0].row, this.check_transversal, false, true, page_td.childNodes[page_col].childNodes[0].err_msg, false, true);
												cells_sum += 1;
											}
											else {
												//if current value could be corrected before it can be used to replace other useful ones
												page_td.childNodes[page_col].childNodes[0].value = renderer.excel_data[this.check_transversal][page_row][page_col - 1];
												page_td.childNodes[page_col].childNodes[0].innerHTML = renderer.excel_data[this.check_transversal][page_row][page_col - 1];
												let ground_truth = renderer.prove(page_td.childNodes[page_col].childNodes[0], page_td.childNodes[page_col].childNodes[0].col, page_td.childNodes[page_col].childNodes[0].row, this.check_transversal, false, true, page_td.childNodes[page_col].childNodes[0].err_msg, false, true);
												if (ground_truth === false) {
													edition_errors += 1;
												}
												cells_sum += 1;
											}
										}
										else if (renderer.falsable_cells[this.check_transversal][page_row][page_col - 1] === null) { //
											//demonstrating true info after exposing unknown info
											if (renderer.falsable_cells[this.old_transversal][page_row][page_col - 1] === true) {
												page_td.childNodes[page_col].childNodes[0].value = ipage[page_row][page_col - 1];
												renderer.prove(page_td.childNodes[page_col].childNodes[0], page_td.childNodes[page_col].childNodes[0].col, page_td.childNodes[page_col].childNodes[0].row, this.check_transversal, false, true, page_td.childNodes[page_col].childNodes[0].err_msg, false, true);
												cells_sum += 1;
											}
											else {
												page_td.childNodes[page_col].childNodes[0].value = ipage[page_row][page_col - 1];
												page_td.childNodes[page_col].childNodes[0].innerHTML = ipage[page_row][page_col - 1];
												let ground_truth = renderer.prove(page_td.childNodes[page_col].childNodes[0], page_td.childNodes[page_col].childNodes[0].col, page_td.childNodes[page_col].childNodes[0].row, this.check_transversal, false, true, page_td.childNodes[page_col].childNodes[0].err_msg, false, true);
												//count erroneous outcome at traversing
												if (ground_truth === false) {
													edition_errors += 1;
												}
												cells_sum += 1;
											}
										}
									}
									catch (error) {
										console.error(error);
									}
								}
							}
							//Get total number of errors
							document.getElementById('error_sheets').innerHTML = 'Con errores: ' + String(parseInt(document.getElementById('error_sheets').innerHTML.split('Con errores: ')[1]) + edition_errors);
							//wants to show only false information
							renderer.render_invalid_page(document.getElementById('show_errors').checked);
							//wants to show only changed information	
							renderer.render_edited_page(document.getElementById('show_changed').checked);
							//states of proofs are read at the end of the loop	

							this.page_shift = true;
							renderer.prev_exp = idx;
							return null;
						}
					}
				}
				catch (error) {
					console.info(error);
				}
			}

			this.trs.push(trDiv);
			if (trDiv.bad_row === true) {
				for (var col = 0; col < trDiv.childNodes.length; col++) {
					if (trDiv.childNodes[col].isinvalid === false) {
						trDiv.childNodes[col].style.marginTop = '-16px';
						trDiv.childNodes[col].style.position = 'relative';
					}
					else {
						trDiv.childNodes[col].style.marginTop = '0px';
						trDiv.childNodes[col].style.position = 'relative';
					}
				}
			}
		}
		document.getElementById('error_sheets').innerHTML = 'Con errores: ' + errors_sum;
		document.getElementById('total_sheets').innerHTML = 'Total de celdas: ' + cells_sum + ' | ';
		return this.trs;
	}

	proveFilled(idx, C, R, Page, X) {
		//index => saving (save condition), change => update (real ground conditions applicate only if values are changed and focusing is discounted), structure => loop (swap condition)
		if (X === null) { //value is handled
			if (idx != false) {
				if (idx.value !== '') {
					if (document.activeElement === idx) { //skip reactivity to focus in case critical info is not given
						return null;
					}
				}
			}
			//assert (this.x !== null)
			this.x = idx.value;		//if edited === undefined: imported, edited === false: focused, edited === true: changed
			//if value in index must be the virtual: idx.val !== null, idx.val !== '' only idx.val === virtual is a valid fill as x is not given, therefore if given must be null then virtual must be null
			//only a value that is never given and does not provide any information is also inexistent
			//virtual information can be visibilized
		}
		else {
			this.x = X;	//empty value is never taken	
		}
		if (idx !== false) {
			if (idx.value !== '') {
				if (document.activeElement === idx) { //skip reactivity to focus
					return null;
				}
			}
		}

		if (this.x !== '') {
			if (idx !== false) {
				idx.style.backgroundColor = null;
				idx.critical = 0;
				idx.falsable = false;
				idx.isinvalid = false;
				idx.isedited = false;
			}
			renderer.falsable_cells[Page][R][C] = false;
       	let count=0;
       	for (var rw = 0; rw < renderer.falsable_cells[Page].length; rw++){
       		for (var r = 0; r < renderer.falsable_cells[Page][rw].length; r++){ 
       			if (renderer.falsable_cells[Page][rw][r] === true){
						count += 1;       		
       			}
       		}	
       	}
			document.getElementById('error_sheets').innerHTML = 'Con errores: '+String(count);
			return true;
		}
		else {
			//mantain process using the handler
			if (idx !== false) {
				idx.critical = 1;
				idx.falsable = true;
				idx.isinvalid = true;
			}

			renderer.falsable_cells[Page][R][C] = true;
			document.getElementById('error_sheets').innerHTML = 'Con errores: ' + String(parseInt(document.getElementById('error_sheets').innerHTML.split('Con errores: ')[1]) + 1);
			return false;
		}
	}
	purify(idx,C,R,Page) {
		/* A function that eliminates validator and trial of column in all pages */
		renderer.falsable_cells[Page][R][C] = false;	 		
		idx.falsable = false; 
		idx.isinvalid = false;
		idx.isedited = false;  
		//idx.trying = [null];
		idx.style.background = null;
		return true;
	}

	proveUnique(idx,C,R,Page,X, save, swap) {
		if (X === null){
			this.x = idx.value;	
			this.row = idx.row;	
		}
		else{
			this.x = X;	
			this.row = R;			
		}
		this.isunique = true;
		if (renderer.hasOwnProperty('vals_unique') === false){
			renderer.vals_unique = [];
		}
		if (idx !== false){
			if (document.activeElement === idx){ //skip reactivity to focus
				return null;		
			}
		}	
	
		for (var row = 0; row < this.row; row++){ //search all the ocurrence in event loop | for (var row = 0; row < this.row; row++)
			if (renderer.vals_unique.includes(renderer.excel_data[Page][row][C])){
			}
			else{	
				renderer.vals_unique.push(renderer.excel_data[Page][row][C]);
			}
		}
		
		//copy data
		let vals_unique = renderer.vals_unique;
		if (X === null){ //x was indexed
			if (vals_unique.includes(this.x) === false || idx.isedited === true){
				vals_unique.push(this.x);
			}
			else if (save === true){ //x was indexed
				if (idx.hasOwnProperty('isnewinfo') === false){
					vals_unique.push(this.x);	//storing value with a previous origin
				}
				else{ //storing repeated values
				}
			}				
		}	
		else{
			vals_unique.push(this.x);	
		}	
		//is it remaining unique if changed? this condition valid if the value exist already
		//reset renderer.vals_unique
		if (vals_unique.indexOf(this.x) !== vals_unique.lastIndexOf(this.x)) {
			if (X !== null) {
				this.isunique = false; //copy can be found before indexing it	
			}
			else {
				if (idx.isedited === true) { //duplicating unique value
					this.isunique = false;
				}
				else if (swap === true) {
					if (R === vals_unique.indexOf(this.x)) {
						//we're at start, so the copy of it will be false
						renderer.falsable_cells[Page][R][C] = false;
						this.isunique = true;
						//values correspond to position of the original while x is in an index and can be erroneous
						//not saving so correction is unfinished
						return null;
					}
					else {
						this.isunique = false;
					}
				}
				else if (save === true) {
					this.isunique = false;	//false origin in page				
				}
			}
		}
		if (this.isunique === false) {
			if (save === true) {
				return false;
			}
			if (idx !== false) {
				idx.unique = 1;
				idx.falsable = true;
				idx.isinvalid = true;
			}

			renderer.falsable_cells[Page][R][C] = true;
			document.getElementById('error_sheets').innerHTML = 'Con errores: ' + String(parseInt(document.getElementById('error_sheets').innerHTML.split('Con errores: ')[1]) + 1);
			return false;
		}
		else {
			if (idx !== false) {
				idx.style.backgroundColor = null;
				idx.unique = 0;
				idx.falsable = false;
				idx.isinvalid = false;
				idx.isedited = false;
			}
			renderer.falsable_cells[Page][R][C] = false;
			//confusion is cleared during valid demonstration
			return true;
		}
	}

	proveRe(idx, C, R, Page, X, re) {

		this.x = X;
		this.y = re;
		this.matching = this.x.match(new RegExp(this.y));

		if (this.matching === null || this.matching.length === null) {
			this.matched = null;
		}
		else {
			this.matched = true;
		}
		if (this.matched === null) { //no match of expressions (outcome is erroneous)
			if (idx !== false) {
				idx.unique = 1;
				idx.isinvalid = true;
				idx.falsable = true;
			}
			renderer.falsable_cells[Page][R][C] = true;
			document.getElementById('error_sheets').innerHTML = 'Con errores: ' + String(parseInt(document.getElementById('error_sheets').innerHTML.split('Con errores: ')[1]) + 1);
			return false;
		}
		else {
			if (idx !== false) {
				idx.unique = 0;
				idx.isinvalid = false;
				idx.falsable = false;
				idx.isedited = false;
				idx.style.backgroundColor = null;
			}
			renderer.falsable_cells[Page][R][C] = false;
			let count = 0;
			for (var rw = 0; rw < renderer.falsable_cells[Page].length; rw++) {
				for (var r = 0; r < renderer.falsable_cells[Page][rw].length; r++) {
					if (renderer.falsable_cells[Page][rw][r] === true) {
						count += 1;
					}
				}
			}
			document.getElementById('error_sheets').innerHTML = 'Con errores: ' + String(count);
			return true;
		}
	}


	proveConditional(idx, C, R, Page, logic){
		let cell_a_key = logic[0];
		let cell_a_logic = logic[1];
		let cell_a_logic_value = logic[2];
		let cell_a_value = null;
		let cell_b_value = idx.value;
		let cell_b_logic = logic[3];
		let cell_b_logic_value = logic[4];

		for (var col = 0; col < renderer.excel_data[Page][R].length; col++) {
			let field_selected = document.getElementById('select_all_selector_' + col);
			if (field_selected.value === cell_a_key) {
				cell_a_value = renderer.excel_data[Page][R][col];
				break;
			} 

		}

		let cond_a_result = conditionalValidation(cell_a_logic,cell_a_value, cell_a_logic_value);
		let cond_b_result = conditionalValidation(cell_b_logic, cell_b_value, cell_b_logic_value);

		if (cond_a_result) {
			if (cond_a_result && cond_b_result) { 
				if (idx !== false) {
					idx.unique = 0;
					idx.isinvalid = false;
					idx.falsable = false;
					idx.isedited = false;
					idx.style.backgroundColor = null;
				}
				renderer.falsable_cells[Page][R][C] = false;
				document.getElementById('error_sheets').innerHTML = 'Con errores: ' + String(parseInt(document.getElementById('error_sheets').innerHTML.split('Con errores: ')[1]) - 1);
				return true;
	
			} else { 
				if (idx !== false) {
					idx.unique = 1;
					idx.isinvalid = true;
					idx.falsable = true;
				}
				renderer.falsable_cells[Page][R][C] = true;
				document.getElementById('error_sheets').innerHTML = 'Con errores: ' + String(parseInt(document.getElementById('error_sheets').innerHTML.split('Con errores: ')[1]) + 1);
				return false;
			}
		} else {
			if (idx !== false) {
				idx.unique = 0;
				idx.isinvalid = false;
				idx.falsable = false;
				idx.isedited = false;
				idx.style.backgroundColor = null;
			}
			renderer.falsable_cells[Page][R][C] = false;
			document.getElementById('error_sheets').innerHTML = 'Con errores: ' + String(parseInt(document.getElementById('error_sheets').innerHTML.split('Con errores: ')[1]) - 1);
			return true;
		}

	}


	prove(idx,C,R,Page,X,process,error,save,swap,re,logic) {

		/* function that returns a boolean for the outcome of true data testing 
			args:
				idx: renderer cell with process attributes
				C (required integer): column of data position
				R (required integer): row of data position
				Page (required integer): page of data
				X: string value of data   
				process (required array): process that returns the boolean of outcome
				error (optional string): response to show when data contains invalid values
				save (required boolean): change process conditions if values are saved
				swap (required boolean): change process conditions if values are traversed
				re (required string): regular expression is given since when the indexed is changed	
				logic (required string): logic for conditional validation
		*/
		if (idx === false){
			if (X === null){
				return null;			
			}		
		}
		this.proving = idx;	
		this.process = process;
		this.x = X;
		this.obj_err_msg = [];

		//prove in page context (initial or transversal)
		for (var j = 0; j < this.process.length; j++) {
			if (typeof renderer.check_transversal !== 'undefined'){
				this.currentp = renderer.check_transversal;			
			}
			else{
				this.currentp = renderer.page;			
			}
			if (this.process[j][0] === 'critical'){
				this.outcome = this.proveFilled(this.proving,C,R,this.currentp, this.x, error, save, swap);
				if (this.outcome === false){ 
					this.obj_err_msg.push(this.process[j][1]);				
				}
				
			}
			else if (this.process[j][0] === 'unique'){
				this.outcome = this.proveUnique(this.proving,C,R,this.currentp, this.x, error, save, swap);
				if (this.outcome === false){
					this.obj_err_msg.push(this.process[j][1]);				
				}
			}
			else if (this.process[j][0] === 're'){
				if (swap === true){
					this.outcome = this.proveRe(this.proving,C,R,this.currentp, this.x, re); //factor is handled but expression is given
				}
				else{
					this.outcome = this.proveRe(this.proving,C,R,this.currentp, this.x, re); //factor is handled				
				}
				if (this.outcome === false){
					this.obj_err_msg.push(this.process[j][1]);				
				}
			} else if(this.process[j][0] === 'conditional'){
				this.outcome = this.proveConditional(this.proving,C,R,this.currentp,logic);
				if (this.outcome === false){ 
					this.obj_err_msg.push(this.process[j][1]);				
				}
			} else if (this.process[j] === null){
				this.outcome = true;			
			}
		}
		if(this.obj_err_msg.length > 0){
			this.proving.err_msg = [];
			this.proving.err_msg = this.obj_err_msg;
			this.proving.falsable = true;
			errorCell(this.proving);
			this.falsek = this.addTooltip(this.proving.parentElement, this.proving.err_msg);
		}

		return this.outcome;
	}
	//XLSX.writeFile(workbook, fname, write_opts) write file back
}
function uploadxls(){
	document.getElementById('pIn').click();
};

let renderer = new renderWidget(document.getElementById('cecilio-importer'), options);		