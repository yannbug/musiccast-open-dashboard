/** MusicCast Monitoring functions by yannbug yann@abc.fr **/

clog( 'wp-geojson-map js script loaded.' );

var device_ip;
var device_name;
var api_base_url = '/YamahaExtendedControl/v1/';
var repeat_timeout = 10000;
var show_log = true;
var last_status = 0;
var glob_play_time = 0;
var playing = false;
var scanning = 0;
var network_ip = '';
var device_list = {};
var timeout_h;

/** device current status **/
var current_power = 'off';
var current_volume = 0;
var current_mute = 'false';
var current_input = 'qobuz';

var current_network_name = '';

function clog(data){
	if(show_log){
		console.log(data);
	}
}
	
/**
 * jQuery functions
 *
 */
(function($) {
	$(document).ready(function() {
				
		/** Get the basic status of the device (power, volume, etc) **/
		get_base_status = function() {
			
			clog( 'Getting basic status...' );
			var url = 'http://' + device_ip + api_base_url + 'main/getStatus';
			$.get( url, function( data ) {
				clog('Success!');
				current_power = data.power;
				clog( 'Got current power: ' + current_power );
				current_volume = data.volume;
				clog( 'Got current volume: ' + current_volume );
				current_mute = data.mute;
				clog( 'Got current mute: ' + current_mute );
				current_input = data.input;	//qobuz or other
				clearTimeout( timeout_h );
				timeout_h = setTimeout( get_status, 100 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		}
		
		/** Get the network status of the device **/
		get_network_status = function() {
			
			clog( 'Getting network status...' );
			var url = 'http://' + device_ip + api_base_url + 'system/getNetworkStatus';
			$.get( url, function( data ) {
				clog('Success!');
				current_network_name = data.network_name;
				clog( 'Got current network_name: ' + current_network_name );
				document.title = 'MusicCast Dashboard : ' + current_network_name;
				clearTimeout( timeout_h );
				timeout_h = setTimeout( get_status, 100 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		}
		
		/** Get the playing status of the device **/
		get_status = function() {
			
			//clog( 'now: ' + $.now() );
			//clog( 'last_status: ' + last_status );
			var time_diff = $.now() - last_status;
			clog( 'Time since last get_status: ' + time_diff );
			if( time_diff < 2000 ) {
				clearTimeout( timeout_h );
				timeout_h = setTimeout( get_status, 1000 );
				return;
			}
			last_status = $.now();
			
			clog( 'Getting playing status...' );
			var url = 'http://' + device_ip + api_base_url + 'netusb/getPlayInfo';
			$.get( url, function( data ) {
				clog('Success!');
				clog(data);
				
				glob_play_time = data.play_time;
				var play_time = pad( Math.floor( glob_play_time / 60 ), 2 ) + ':' +
					pad( ( glob_play_time % 60 ), 2 );
				var total_time = pad( Math.floor( data.total_time / 60 ), 2 ) + ':' +
					pad( ( data.total_time % 60 ), 2 );
				var remaining_time = data.total_time - data.play_time;
				if( remaining_time < 10 ) {
					repeat_timeout = (remaining_time + 1) * 1000;
				}
				
				if( 'play' == data.playback ) {
					playing = true;
				} else {
					playing = false;
				}
				
				if( current_mute ) {
					var mute_color = '#a2d8d1';
				} else {
					var mute_color = '#6a7f7c';
				}
				
				var html = '<div style="height:127px;overflow:hidden;">' +
				
					'<div style="overflow:hidden;background-color:#272e36;padding:13px 15px 5px 15px;margin: 0 50px;border-top:1px solid #111;border-left:1px solid #111;border-bottom:1px solid #b0b0b0;border-right:1px solid #b0b0b0;">' +
					'<ul style="list-style-type:none;padding:0;margin:0;">' +
				
					'<li style="float:left;padding:0 5px 0 0;"><span id="status_button" class="t" style="text-transform:capitalize;">' + data.input + ':</span> <strong>' + data.track + '</strong></li>' +
					'<li style="float:left;padding:0 0 0 5px;" id="prev_button"><i class="fa fa-step-backward"></i></li>' +
					'<li style="float:left;padding:0 0 0 5px;"><span class="t">[</span> <strong><span id="pt">' + play_time + '</span> / ' + total_time + '</strong> <strong>]</strong></li>' +
					'<li style="float:left;padding:0 0 0 5px;" id="next_button"><i class="fa fa-step-forward"></i></li>' +
					'<li style="float:left;padding:0 0 0 5px;" id="stop_button"><i class="fa fa-stop"></i></li>' +
					'<li style="float:left;padding:0 0 0 5px;" id="play_button"><i class="fa fa-play"></i></li>' +

					'<li style="float:right;padding:0 0 0 0;margin-top:-3px;" id="volume_inc"><i class="material-icons">volume_up</i></li>' +
					'<li style="float:right;padding:0 0 0 0;" id="volume_dec">' + current_volume + '</li>' +
					'<li style="float:right;padding:0 0 0 5px;margin-top:-3px;" id="volume_dec"><i class="material-icons">volume_down</i></li>' +
					
					'<li style="float:left;clear:left;padding:0 5px 0 0;max-height:1.1em;max-width:71%;overflow:hidden;"><span class="t">Album / Artist:</span> <strong>' + data.album + '</strong></li>' +
					'<li style="float:left;padding:0;"><span class="t">/</span> <strong>' + data.artist + '</strong></li>' +
					
					'<li style="float:left;clear:left;padding:0 5px 0 0;"><span class="t">Type:</span> <strong style="text-transform:capitalize;">' + data.play_queue_type + '</strong></li>' +
					'<li style="float:left;padding:0 5px;"><span class="t">Repeat:</span> <strong style="text-transform:capitalize;">' + data.repeat + '</strong></li>' +
					'<li style="float:left;padding:0 0 0 5px;"><span class="t">Shuffle:</span> <strong style="text-transform:capitalize;">' + data.shuffle + '</strong></li>' +
					'<li style="float:right;padding:0 0 0 5px;" id="mute_button"><i class="material-icons" style="color:' + mute_color + ';">volume_off</i></li>' +
					
					'</ul></div></div>';
				
				if( data.albumart_url ) {
					html += '<div id="visual"><img src="http://' + device_ip + data.albumart_url + '" style="width:100% auto" /></div>';
				}
				$('#content').html( html );
				
				/** Update basic status displays **/
				clog( 'current power: ' + current_power );
				if( current_power == 'off' || current_power == 'standby' ) {
					$('#middle_led').css( 'background-image', "url('img/off-light.png')" );
				} else {
					$('#middle_led').css( 'background-image', 'none' );
				}
				
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
			clearTimeout( timeout_h );
			timeout_h = setTimeout( get_status, repeat_timeout );
			repeat_timeout = 10000;
		}
		
		/** Update play time seconds **/
		update_pt = function() {
			if( !playing ) {
				setTimeout( update_pt, 10 );
				return;
			}
			glob_play_time ++;
			var play_time = pad( Math.floor( glob_play_time / 60 ), 2 ) + ':' +
			pad( ( glob_play_time % 60 ), 2 );
			$('#pt').html( play_time );
			if( playing ) {
				$('#play_button').fadeToggle( 500 ).fadeToggle( 500 );
			}
			setTimeout( update_pt, 1000 );
		}
		update_pt();
		
		/**Scan the network for devices **/
		scan_network = function() {
			if( 0 == scanning || 254 < scanning ) {
				return;
			}
			var ip_to_scan = network_ip + '.' + scanning;
			clog( 'scanning IP: ' + ip_to_scan );
			
			var url = 'http://' + ip_to_scan + api_base_url + 'system/getNetworkStatus';
			$.get( url, function( data ) {
				clog('Found device at IP: ' + ip_to_scan );
				device_list[ip_to_scan] = data.network_name;
				
				clog( 'device_list now:' );
				clog( device_list );
				
				//localStorage.device_list = device_list;
				//localStorage.setItem("device_list", JSON.stringify(device_list));
				var storable = JSON.stringify( device_list );
				localStorage.device_list = storable;
				
				clog( 'localStorage.device_list now:' );
				clog( storable );
				clog( localStorage.device_list );
				
			}).fail( function() {
				clog( 'Failed scan for IP: ' + ip_to_scan  + ' /URL: ' + url );
			});
			
			scanning ++;
			if( 255 > scanning ) {
				setTimeout( scan_network, 1000 );
			}
		}
		
		/** Add leading zeroes **/
		pad = function(str, max) {
			str = str.toString();
			return str.length < max ? pad("0" + str, max) : str;
		}
		
		populate_list_selector = function() {
			if( !device_list ) {
				device_list = JSON.parse(localStorage.getItem("device_list"));
			}
			if( !device_list ) {
				return;
			}
			clog( 'populate with device list:' );
			clog( device_list );
			
			$('#device_list_sel').html('');
			$.each( device_list, function( ip_addr, device_name ){
				clog('adding option ' + device_name);
				var option = new Option( device_name, ip_addr );
				//$(option).html( device_name );
				$('#device_list_sel').append(option);
			});
		}
		
		clog( 'MusicCast jQ functions loaded!' );
		
		if( localStorage.device_ip ) {
			clog('localStorage.device_ip:');
			clog(localStorage.device_ip);
			device_ip = localStorage.device_ip;
		}
		if( localStorage.getItem("device_list") ) {
			if( stored_list = JSON.parse(localStorage.getItem("device_list")) ) {
				clog('localStorage.device_list:');
				clog(localStorage.device_list);
				clog(stored_list);
				device_list = stored_list;
			}
		}
		
		/** Fetch status when starting **/
		if( !device_ip ) {
			$('#get_ip').show();
			populate_list_selector();
		} else {
			$('#change_ip').show();
			get_network_status();
			get_base_status();
			//get_status();
		}
		
		$('#device_list_sel').on('change', function(e){
			var optionSelected = $("option:selected", this);
			$('#device_ip').val($(e.target).val());
		});
		
		$('#ok_button').on('click', function(e){
			clog( 'clicked Ok!' );
			device_ip = $('#device_ip').val();
			clog( 'device_ip: ' + device_ip );
			get_status();
			localStorage.device_ip = device_ip;
			$('#get_ip').hide();
			$('#change_ip').show();
		});
		
		$('#switch_button').on('click', function(e){
			clog( 'clicked Switch device!' );
			$('#device_ip').val( device_ip );
			$('#get_ip').show();
			populate_list_selector();
			$('#change_ip').hide();
		});
		
		$(document.body).on( 'click', '#info_button', function(e){
			clog( 'clicked Info!' );
			var url = 'http://' + device_ip + api_base_url + 'system/getDeviceInfo';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
				var html = JSON.stringify( data );
				$('#visual').html( html );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#features_button').on('click', function(e){
			clog( 'clicked Features!' );
			var url = 'http://' + device_ip + api_base_url + 'system/getFeatures';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
				var html = JSON.stringify( data );
				$('#visual').html( html );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$(document.body).on( 'click', '#network_button', function(e){
			clog( 'clicked Network!' );
			var url = 'http://' + device_ip + api_base_url + 'system/getNetworkStatus';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
				var html = JSON.stringify( data );
				$('#visual').html( html );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#fs_button').on('click', function(e){
			clog( 'clicked Function Status!' );
			var url = 'http://' + device_ip + api_base_url + 'system/getFuncStatus';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
				var html = JSON.stringify( data );
				$('#visual').html( html );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$(document.body).on( 'click', '#status_button', function(e){
			clog( 'clicked Status Button!' );
			var url = 'http://' + device_ip + api_base_url + 'main/getStatus';
			$.get( url, function( data ) {
				clog('Success!');
				//get_status();
				var html = JSON.stringify( data );
				$('#visual').html( html );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#scan_button').on('click', function(e){
			clog( 'clicked Scan!' );
			
			if( !device_ip ) {
				$('#get_ip').show();
				populate_list_selector();
				$('#change_ip').hide();
				return;
			}
			
			var ip_bytes = device_ip.split('.');
			network_ip = ip_bytes[0]+'.'+ip_bytes[1]+'.'+ip_bytes[2];
			clog( 'net IP: ' + network_ip );
			
			scanning = 1;
			scan_network();
		});
		
		$(document.body).on( 'click', '#mute_button', function(e){
			clog( 'Current mute is: ' + current_mute );
			if( current_mute ) {
				clog( 'Un-muting...' );
				var enable = 'false';
			} else {
				clog( 'Muting...' );
				var enable = 'true';
			}
			var url = 'http://' + device_ip + api_base_url + 'main/setMute?enable=' + enable;
			$.get( url, function( data ) {
				clog('Success!');
				setTimeout( get_base_status, 100 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$(document.body).on( 'click', '#volume_dec', function(e){
			clog( 'Decreasing volume...' );
			var url = 'http://' + device_ip + api_base_url + 'main/setVolume?volume=down';
			$.get( url, function( data ) {
				clog('Success!');
				setTimeout( get_base_status, 100 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$(document.body).on( 'click', '#volume_inc', function(e){
			clog( 'Increasing volume...' );
			var url = 'http://' + device_ip + api_base_url + 'main/setVolume?volume=up';
			$.get( url, function( data ) {
				clog('Success!');
				setTimeout( get_base_status, 100 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$(document.body).on( 'click', '#prev_button', function(e){
			clog( 'Jumping to previous track...' );
			var url = 'http://' + device_ip + api_base_url + 'netusb/setPlayback?playback=previous';
			$.get( url, function( data ) {
				$.get( url, function( data ) {
					clog('Success!');
					clearTimeout( timeout_h );
					timeout_h = setTimeout( get_status, 2000 );
				});
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$(document.body).on( 'click', '#next_button', function(e){
			clog( 'Jumping to next track...' );
			var url = 'http://' + device_ip + api_base_url + 'netusb/setPlayback?playback=next';
			$.get( url, function( data ) {
				clog('Success!');
				clearTimeout( timeout_h );
				timeout_h = setTimeout( get_status, 2000 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$(document.body).on( 'click', '#stop_button', function(e){
			clog( 'Stop...' );
			var url = 'http://' + device_ip + api_base_url + 'netusb/setPlayback?playback=stop';
			$.get( url, function( data ) {
				clog('Success!');
				playing = false;
				clearTimeout( timeout_h );
				timeout_h = setTimeout( get_status, 2000 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$(document.body).on( 'click', '#play_button', function(e){
			clog( 'Play...' );
			var url = 'http://' + device_ip + api_base_url + 'netusb/setPlayback?playback=play';
			$.get( url, function( data ) {
				clog('Success!');
				playing = true;
				clearTimeout( timeout_h );
				timeout_h = setTimeout( get_status, 2000 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		/** Power on / off **/
		$('#middle_led').on('click', function(e){
			clog( 'Power toggle...' );
			var url = 'http://' + device_ip + api_base_url + 'main/setPower?power=toggle';
			$.get( url, function( data ) {
				clog('Success!');
				//get_base_status();
				clearTimeout( timeout_h );
				setTimeout( get_base_status, 100 );
				//get_base_status();
				//get_status();
				//clearTimeout( timeout_h );
				//timeout_h = setTimeout( get_status, 1000 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
	});
})( jQuery );