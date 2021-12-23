import React, { useState, useEffect, useRef } from "react";
import { FileUpload } from "primereact/fileupload";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import Menu from "../components/Menu";
import ImagesService from "../service/ImagesService";
import LocalStorageService from "../service/LocalStorageService";

export default function Images() {
	const toast = useRef(null);
	const myLocalStorage = "liber-images";
	const [liberImages, setLiberImages] = useState([]);

	useEffect(() => {
		setLiberImages(LocalStorageService.initLocal(myLocalStorage));
	}, []);

	const getImageUploaded = async (formData, batch) => {
		return ImagesService.uploadImage(formData, batch)
			.then(({ data }) => data)
			.catch((err) => {
				console.error(err);
				messages("error", "Falló", err);
			});
	};

	const onUpload = async (e) => {
		let batch = await JSON.parse(e.xhr.response);
		let imageTaken = e.files[0];
		if (e.xhr.status === 201) {
			if (batch.latency === 0) {
				let data = new FormData();
				data.append("image", imageTaken, imageTaken.name);
				let dataImage = await getImageUploaded(data, batch.id);
				if (LocalStorageService.saveData(myLocalStorage, dataImage)) {
					setLiberImages(
						LocalStorageService.getAllData(myLocalStorage)
					);
					messages("success", "Imagen subida", "Tu imagen se guardo");
				} else {
					messages(
						"error",
						"Imagen no subida",
						"Tu imagen no se guardo"
					);
				}
			}
		} else {
			messages(
				"error",
				"Problemas en el servidor",
				"Intentalo más tarde"
			);
		}
	};

	const footer = `En total existen ${
		liberImages ? liberImages.length : 0
	} imágenes.`;

	const name = ({ filename }) => <span>{filename}</span>;

	const dimensions = ({ source: { height, width } }) => (
		<span>{`${height} x ${width}`}</span>
	);

	const image = ({ source: { url } }) => (
		<img className="" style={{ width: "100px" }} alt={url} src={url} />
	);

	const actions = ({ id, source: { url } }) => (
		<div>
			<a href={url} target="_blank" rel="noreferrer">
				<Button
					icon="pi pi-arrow-up-right"
					className="p-button-rounded p-button-warning"
				/>
			</a>
			<Button
				icon="pi pi-trash"
				className="p-button-rounded p-button-danger p-mx-sm-2"
				onClick={() => confirm(id)}
			/>
			<Button
				icon="pi pi-copy"
				className="p-button-rounded p-button-info"
				onClick={() => copyToClipboard(url)}
			/>
		</div>
	);

	const copyToClipboard = (url) => {
		navigator.clipboard.writeText(url);
		messages(
			"info",
			"URL Copiada",
			"Se ha copiado al portapapeles el enlace"
		);
	};

	const accept = (id) => {
		if (LocalStorageService.deleteData(myLocalStorage, id)) {
			setLiberImages(LocalStorageService.getAllData(myLocalStorage));
			messages("success", "Imagen eliminada", "Se eliminó la imagen");
		} else {
			messages("error", "Ocurrío un error", "La imagen no se eliminó");
		}
	};

	const confirm = (id) => {
		confirmDialog({
			header: "Eliminación",
			message: "¿Deseas eliminar esta imagen para siempre?",
			icon: "pi pi-info-circle",
			acceptClassName: "p-button-danger",
			accept: () => accept(id),
			draggable: false,
			closable: true,
			closeOnEscape: true,
		});
	};

	const messages = (severity, summary, detail) => {
		toast.current.show({ severity, summary, detail, life: 3000 });
	};

	return (
		<div style={{ color: "var(--yellow-50)", fontFamily: "Poppins" }}>
			<Menu />
			<Toast ref={toast}></Toast>
			<div className="p-grid p-dir-col p-text-center p-p-4">
				<div className="p-col">
					<div className="p-text-bold" style={{ fontSize: "40px" }}>
						Imágenes
					</div>
					<div
						className="p-mb-2 p-text-justify p-text-sm-center"
						style={{ fontSize: "25px" }}
					>
						Aquí podrás guardar tus imágenes en internet para poder
						usarlas en cualquier lado
					</div>
					<FileUpload
						name="File"
						url="https://api-upscaler-origin.icons8.com/api/frontend/v1/batches"
						onUpload={onUpload}
						accept="image/*"
						maxFileSize={5000000}
						chooseLabel="Añadir imagen"
						uploadLabel="Subir imagen"
						cancelLabel="Cancelar"
						emptyTemplate={
							<p className="p-m-0">Sin ninguna imagen</p>
						}
					/>
				</div>
				<div className="p-col">
					<div className="p-card">
						<DataTable
							value={liberImages}
							header="Tabla de imágenes guardadas localmente"
							footer={footer}
							responsiveLayout="stack"
							paginator
							rows={5}
						>
							<Column header="Nombre" body={name} />
							<Column header="Dimensiones" body={dimensions} />
							<Column header="Imagen" body={image} />
							<Column header="Acciones" body={actions} />
						</DataTable>
					</div>
				</div>
			</div>
		</div>
	);
}
